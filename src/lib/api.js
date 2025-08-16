/**
 * Frontend API Library for AceSweeps Casino
 * 
 * This library provides a clean interface to interact with the backend API.
 * Use this in your React components for consistent API calls.
 */

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Admin API Functions
 */
export const adminAPI = {
  /**
   * Admin login
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async login(username, password) {
    return apiCall('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  /**
   * Generate a new 5-digit code (valid for 3 hours)
   * @returns {Promise<{success: boolean, code: string, validFor: string, validUntil: string}>}
   */
  async generateCode() {
    return apiCall('/api/admin/generate-code', {
      method: 'GET'
    });
  }
};

/**
 * Player API Functions
 */
export const playerAPI = {
  /**
   * Submit a code and spin the wheel
   * @param {string} code - 5-digit code
   * @returns {Promise<{success: boolean, prize: number, outcome: string, message: string}>}
   */
  async spin(code) {
    return apiCall('/api/player/spin', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }
};

/**
 * System API Functions
 */
export const systemAPI = {
  /**
   * Check backend health
   * @returns {Promise<{status: string, timestamp: string, environment: string}>}
   */
  async healthCheck() {
    return apiCall('/health');
  },

  /**
   * Test database connectivity
   * @returns {Promise<{ok: boolean, time: string, env: string}>}
   */
  async testDatabase() {
    return apiCall('/api/health');
  }
};

/**
 * Unified API object (for backward compatibility)
 */
export const api = {
  ...adminAPI,
  ...playerAPI,
  ...systemAPI,
  
  // Legacy method names for compatibility
  createCode: adminAPI.generateCode,
  verifyCode: playerAPI.spin,
  testDB: systemAPI.testDatabase
};

/**
 * React Hook for API calls with loading states
 * Usage: const { data, loading, error, execute } = useAPI();
 */
export function useAPI() {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiFunction, ...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
      throw error;
    }
  }, []);

  return { ...state, execute };
}

// Default export
export default api;
