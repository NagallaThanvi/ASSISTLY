/**
 * Security Configuration and Best Practices
 * 
 * Centralized security settings for the application
 */

/**
 * Content Security Policy (CSP) headers
 * Add these to your hosting provider or _headers file
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://*.cloudfunctions.net',
    'https://firestore.googleapis.com',
    'https://api.groq.com',
    'https://api.openai.com',
    'https://api-inference.huggingface.co'
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Security headers to add to _headers file
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=()'
};

/**
 * Validate API key format before use
 */
export const validateApiKey = (key, type = 'generic') => {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const patterns = {
    firebase: /^AIza[0-9A-Za-z-_]{35}$/,
    groq: /^gsk_[A-Za-z0-9]{52}$/,
    openai: /^sk-[A-Za-z0-9]{48}$/,
    sendgrid: /^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/,
    huggingface: /^hf_[A-Za-z0-9]{34}$/
  };

  if (patterns[type] && !patterns[type].test(key)) {
    return { 
      valid: false, 
      error: `Invalid ${type} API key format. Please check your .env file.` 
    };
  }

  return { valid: true };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength (0-100)
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;
  
  // Length
  strength += Math.min(password.length * 4, 40);
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/\d/.test(password)) strength += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
  
  // Patterns (deductions)
  if (/(.)\1{2,}/.test(password)) strength -= 10; // Repeated characters
  if (/^[a-z]+$/.test(password)) strength -= 10; // Only lowercase
  if (/^[A-Z]+$/.test(password)) strength -= 10; // Only uppercase
  if (/^\d+$/.test(password)) strength -= 10; // Only numbers
  
  return Math.max(0, Math.min(100, strength));
};

/**
 * Prevent clickjacking attacks
 */
export const preventClickjacking = () => {
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
};

/**
 * Check if running in secure context (HTTPS or localhost)
 */
export const isSecureContext = () => {
  return window.isSecureContext || 
         window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Validate Firebase configuration
 */
export const validateFirebaseConfig = (config) => {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing Firebase config: ${missing.join(', ')}. Check your .env file.`
    };
  }

  // Validate API key format
  const apiKeyValidation = validateApiKey(config.apiKey, 'firebase');
  if (!apiKeyValidation.valid) {
    return apiKeyValidation;
  }

  return { valid: true };
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data) => {
  if (typeof data === 'string') {
    // Mask email
    data = data.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '***@***.***');
    // Mask API keys
    data = data.replace(/(AIza|sk-|gsk_|SG\.|hf_)[A-Za-z0-9_-]+/gi, '$1***');
    // Mask credit card numbers
    data = data.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '**** **** **** ****');
  }
  return data;
};

/**
 * Generate secure random string
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check for common security misconfigurations
 */
export const runSecurityChecks = () => {
  const issues = [];

  // Check if running in secure context
  if (!isSecureContext() && process.env.NODE_ENV === 'production') {
    issues.push('⚠️ Application is not running in a secure context (HTTPS)');
  }

  // Check for exposed API keys in window object
  if (window.FIREBASE_CONFIG || window.API_KEY) {
    issues.push('⚠️ API keys detected in window object - potential security risk');
  }

  // Check for debug mode in production
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_DEBUG_MODE === 'true') {
    issues.push('⚠️ Debug mode is enabled in production');
  }

  // Warn about missing CSP headers
  const hasCspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!hasCspHeader && process.env.NODE_ENV === 'production') {
    issues.push('⚠️ Content Security Policy (CSP) headers not detected');
  }

  return issues;
};

export default {
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  validateApiKey,
  sanitizeInput,
  isValidEmail,
  validatePassword,
  preventClickjacking,
  isSecureContext,
  validateFirebaseConfig,
  maskSensitiveData,
  generateSecureToken,
  runSecurityChecks
};
