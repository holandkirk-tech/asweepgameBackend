const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const {
  DATABASE_URL,
  NODE_ENV = 'development'
} = process.env;

// Database connection with SSL for production
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Simplified - no sessions needed

// Spin wheel outcomes with weights
const SPIN_OUTCOMES = [
  { prize: "$100", weight: 0.05, cents: 10000 },
  { prize: "$75", weight: 0.10, cents: 7500 },
  { prize: "$50", weight: 0.15, cents: 5000 },
  { prize: "$25", weight: 0.20, cents: 2500 },
  { prize: "$10", weight: 0.20, cents: 1000 },
  { prize: "$5", weight: 0.20, cents: 500 },
  { prize: "Try Again", weight: 0.10, cents: 0 }
];

// Utility functions

function generateSpinCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function selectWeightedOutcome() {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const outcome of SPIN_OUTCOMES) {
    cumulativeWeight += outcome.weight;
    if (random <= cumulativeWeight) {
      return outcome;
    }
  }
  
  // Fallback to last outcome
  return SPIN_OUTCOMES[SPIN_OUTCOMES.length - 1];
}

// Database initialization
async function initializeDatabase() {
  try {
    // Create spin_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spin_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(5) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'unused',
        created_at TIMESTAMP DEFAULT NOW(),
        used_at TIMESTAMP
      )
    `);

    // Create spin_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spin_results (
        id SERIAL PRIMARY KEY,
        code_id INT REFERENCES spin_codes(id),
        outcome VARCHAR(50) NOT NULL,
        prize_cents INT DEFAULT 0,
        odds NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// No authentication - simplified for temp use

// Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      time: result.rows[0].now,
      database: 'Connected successfully',
      environment: NODE_ENV
    });
  } catch (err) {
    console.error('DB test failed:', err.message);
    res.status(500).json({
      status: 'error',
      message: err.message,
      database: 'Connection failed'
    });
  }
});

// Simplified admin login - no real auth
app.post('/admin/login', async (req, res) => {
  res.json({
    success: true,
    message: 'Temp login - no auth required'
  });
});

// Generate spin codes - no auth needed
app.post('/admin/generate', async (req, res) => {
  try {
    const { count = 1 } = req.body;
    const codes = [];
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const code = generateSpinCode();
      
      try {
        const result = await pool.query(
          'INSERT INTO spin_codes (code) VALUES ($1) RETURNING id, code, created_at',
          [code]
        );
        codes.push(result.rows[0]);
      } catch (dbError) {
        // Handle duplicate code, try again
        if (dbError.code === '23505') {
          i--; // Retry this iteration
          continue;
        }
        throw dbError;
      }
    }
    
    res.json({
      success: true,
      codes,
      generated: codes.length
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate codes' });
  }
});

// Get all generated codes - no auth needed  
app.get('/admin/codes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sc.id, sc.code, sc.status, sc.created_at, sc.used_at,
        sr.outcome, sr.prize_cents, sr.odds
      FROM spin_codes sc
      LEFT JOIN spin_results sr ON sc.id = sr.code_id
      ORDER BY sc.created_at DESC
      LIMIT 100
    `);
    
    res.json({
      success: true,
      codes: result.rows
    });
  } catch (error) {
    console.error('Codes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Verify spin code
app.post('/spin/verify', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || code.length !== 5 || !/^\d{5}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format' });
    }
    
    const result = await pool.query(
      'SELECT id, code, status FROM spin_codes WHERE code = $1',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Code not found' });
    }
    
    const codeData = result.rows[0];
    
    if (codeData.status === 'used') {
      return res.status(400).json({ error: 'Code already used' });
    }
    
    res.json({
      success: true,
      valid: true,
      code: codeData.code
    });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Play spin wheel
app.post('/spin/play', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { code } = req.body;
    
    if (!code || code.length !== 5 || !/^\d{5}$/.test(code)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid code format' });
    }
    
    // Check if code exists and is unused
    const codeResult = await client.query(
      'SELECT id, code, status FROM spin_codes WHERE code = $1 FOR UPDATE',
      [code]
    );
    
    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Code not found' });
    }
    
    const codeData = codeResult.rows[0];
    
    if (codeData.status === 'used') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Code already used' });
    }
    
    // Select random outcome
    const outcome = selectWeightedOutcome();
    
    // Mark code as used
    await client.query(
      'UPDATE spin_codes SET status = $1, used_at = NOW() WHERE id = $2',
      ['used', codeData.id]
    );
    
    // Save spin result
    const resultInsert = await client.query(`
      INSERT INTO spin_results (code_id, outcome, prize_cents, odds)
      VALUES ($1, $2, $3, $4)
      RETURNING id, outcome, prize_cents, odds, created_at
    `, [codeData.id, outcome.prize, outcome.cents, outcome.weight]);
    
    await client.query('COMMIT');
    
    const spinResult = resultInsert.rows[0];
    
    res.json({
      success: true,
      result: {
        outcome: spinResult.outcome,
        prize_cents: spinResult.prize_cents,
        odds: parseFloat(spinResult.odds),
        spin_id: spinResult.id,
        timestamp: spinResult.created_at
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Spin play error:', error);
    res.status(500).json({ error: 'Spin failed' });
  } finally {
    client.release();
  }
});

// Get spin results - no auth needed
app.get('/admin/results', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        sr.id, sr.outcome, sr.prize_cents, sr.odds, sr.created_at,
        sc.code
      FROM spin_results sr
      JOIN spin_codes sc ON sr.code_id = sc.id
      ORDER BY sr.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM spin_results'
    );
    
    res.json({
      success: true,
      results: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Admin logout - simplified
app.post('/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🎰 AceSweeps Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
