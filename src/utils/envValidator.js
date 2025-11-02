/**
 * Environment Variable Validator
 * Ensures all required environment variables are present and valid
 */

const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const optionalEnvVars = [
  'REACT_APP_GA_ID',
  'REACT_APP_NAME',
  'REACT_APP_DESCRIPTION',
  'REACT_APP_URL',
  'REACT_APP_ENABLE_ANALYTICS',
  'REACT_APP_ENABLE_NOTIFICATIONS',
  'REACT_APP_API_TIMEOUT',
  'REACT_APP_MAX_FILE_SIZE'
];

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables and warn if missing
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missing.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Optional environment variables not set:', warnings);
  }

  // Validate Firebase config format
  validateFirebaseConfig();

  return true;
};

/**
 * Validate Firebase configuration
 */
const validateFirebaseConfig = () => {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;

  // Basic validation
  if (apiKey && apiKey.length < 20) {
    console.warn('Firebase API key seems invalid (too short)');
  }

  if (projectId && !projectId.match(/^[a-z0-9-]+$/)) {
    console.warn('Firebase project ID format seems invalid');
  }

  if (authDomain && !authDomain.includes('.firebaseapp.com')) {
    console.warn('Firebase auth domain format seems invalid');
  }
};

/**
 * Get environment variable with default value
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not set
 * @returns {*} - Environment variable value or default
 */
export const getEnv = (key, defaultValue = '') => {
  return process.env[key] || defaultValue;
};

/**
 * Get boolean environment variable
 * @param {string} key - Environment variable key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} - Boolean value
 */
export const getBoolEnv = (key, defaultValue = false) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Get number environment variable
 * @param {string} key - Environment variable key
 * @param {number} defaultValue - Default value
 * @returns {number} - Number value
 */
export const getNumberEnv = (key, defaultValue = 0) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Check if running in production
 * @returns {boolean}
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Get app configuration
 * @returns {Object} - App configuration
 */
export const getAppConfig = () => {
  return {
    name: getEnv('REACT_APP_NAME', 'Assistly'),
    description: getEnv('REACT_APP_DESCRIPTION', 'Community assistance platform'),
    url: getEnv('REACT_APP_URL', window.location.origin),
    enableAnalytics: getBoolEnv('REACT_APP_ENABLE_ANALYTICS', true),
    enableNotifications: getBoolEnv('REACT_APP_ENABLE_NOTIFICATIONS', true),
    apiTimeout: getNumberEnv('REACT_APP_API_TIMEOUT', 30000),
    maxFileSize: getNumberEnv('REACT_APP_MAX_FILE_SIZE', 5242880) // 5MB default
  };
};

// Validate on import (only in browser environment)
if (typeof window !== 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // In production, show user-friendly error
    if (isProduction()) {
      document.body.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: Arial, sans-serif;
          background: #f5f5f5;
        ">
          <div style="
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
          ">
            <h1 style="color: #d32f2f; margin-bottom: 1rem;">Configuration Error</h1>
            <p style="color: #666;">
              The application is not properly configured. Please contact the administrator.
            </p>
          </div>
        </div>
      `;
    }
  }
}

export default {
  validateEnv,
  getEnv,
  getBoolEnv,
  getNumberEnv,
  isProduction,
  isDevelopment,
  getAppConfig
};
