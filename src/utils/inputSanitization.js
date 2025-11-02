/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized string
 */
export const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize user input for display
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove any script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize URL to prevent XSS
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') return '';
  
  // Remove javascript: and data: protocols
  const sanitized = url.replace(/^(javascript|data|vbscript):/gi, '');
  
  // Validate URL format
  try {
    const urlObj = new URL(sanitized, window.location.origin);
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(urlObj.protocol)) {
      return urlObj.href;
    }
  } catch (e) {
    // Invalid URL
    return '';
  }
  
  return '';
};

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';
  
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string} - Sanitized email or empty string
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + at the start
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
};

/**
 * Limit string length safely
 * @param {string} str - String to limit
 * @param {number} maxLength - Maximum length
 * @returns {string} - Limited string
 */
export const limitLength = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLength);
};

/**
 * Deep sanitize object (for form data)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} - Sanitized coordinates or null
 */
export const sanitizeCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (
    isNaN(latitude) || isNaN(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return null;
  }
  
  return { lat: latitude, lng: longitude };
};
