# 🎰 AceSweeps Casino Backend

A Node.js backend API for a spin wheel casino game with admin panel, code generation, and weighted prize distribution.

## 🚀 Features

- **Admin Authentication**: Secure login with session management
- **Code Generation**: Generate 5-digit numeric codes for players
- **Spin Wheel Logic**: Weighted random prize selection
- **Database Integration**: PostgreSQL with Neon for production
- **Rate Limiting**: Prevent abuse and ensure fair play
- **Vercel Ready**: Configured for serverless deployment

## 🏗️ Project Structure

```
asweepgameBackend/
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── vercel.json         # Vercel deployment config
├── env.example         # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/holandkirk-tech/asweepgameBackend.git
cd asweepgameBackend

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Database Configuration (Neon Postgres)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Security
SESSION_SECRET=your_random_session_secret_32_chars_long
JWT_SECRET=your_jwt_secret_key_here

# Environment
NODE_ENV=development
PORT=3000
```

## 🗄️ Database Schema

The application automatically creates the following tables:

### `spin_codes`
```sql
CREATE TABLE spin_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'unused',
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);
```

### `spin_results`
```sql
CREATE TABLE spin_results (
  id SERIAL PRIMARY KEY,
  code_id INT REFERENCES spin_codes(id),
  outcome VARCHAR(50) NOT NULL,
  prize_cents INT DEFAULT 0,
  odds NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Prize Distribution

| Prize | Weight | Probability |
|-------|--------|-------------|
| $100  | 0.05   | 5%          |
| $75   | 0.10   | 10%         |
| $50   | 0.15   | 15%         |
| $25   | 0.20   | 20%         |
| $10   | 0.20   | 20%         |
| $5    | 0.20   | 20%         |
| Try Again | 0.10 | 10%       |

## 🔌 API Endpoints

### Public Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "Backend is running",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "environment": "development"
}
```

#### `POST /spin/verify`
Verify if a spin code is valid and unused.

**Request:**
```json
{
  "code": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "code": "12345"
}
```

#### `POST /spin/play`
Use a code to spin the wheel and get a prize.

**Request:**
```json
{
  "code": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "outcome": "$25",
    "prize_cents": 2500,
    "odds": 0.20,
    "spin_id": 1,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### Admin Endpoints (Require Authentication)

#### `POST /admin/login`
Admin authentication.

**Request:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "session_token_here",
  "expiresIn": "24h"
}
```

#### `POST /admin/generate`
Generate new spin codes.

**Headers:**
```
Authorization: Bearer your_session_token
```

**Request:**
```json
{
  "count": 10
}
```

**Response:**
```json
{
  "success": true,
  "codes": [
    {
      "id": 1,
      "code": "12345",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "generated": 10
}
```

#### `GET /admin/codes`
Get all generated codes with their status.

**Headers:**
```
Authorization: Bearer your_session_token
```

#### `GET /admin/results`
Get spin results with pagination.

**Headers:**
```
Authorization: Bearer your_session_token
```

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Offset for pagination (default: 0)

#### `POST /admin/logout`
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer your_session_token
```

## 🚀 Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

## 📤 Deployment

### Vercel Deployment

1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add all environment variables from `.env`
   - Make sure to set `NODE_ENV=production`

3. **Database Setup:**
   - Create a Neon PostgreSQL database
   - Copy the connection string to `DATABASE_URL`
   - Tables will be created automatically on first run

### Manual Deployment

1. **Prepare the server:**
   ```bash
   # Install Node.js 20.x
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy:**
   ```bash
   # Clone and setup
   git clone https://github.com/holandkirk-tech/asweepgameBackend.git
   cd asweepgameBackend
   npm install --production
   
   # Configure environment
   cp env.example .env
   # Edit .env with production values
   
   # Start with PM2
   pm2 start server.js --name "asweepgame-backend"
   pm2 save
   pm2 startup
   ```

## 🔒 Security Features

- **Session Management**: Secure token-based authentication
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable cross-origin policies
- **Rate Limiting**: Built-in protection against abuse
- **Environment Isolation**: Separate development/production configs

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test admin login
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Test code verification
curl -X POST http://localhost:3000/spin/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"12345"}'
```

## 📝 License

ISC License - see package.json for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Built with ❤️ by holandkirk-tech**
