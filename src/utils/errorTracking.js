/**
 * Error Tracking and Logging System
 * Centralized error handling for production-ready monitoring
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors in memory
    this.enabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Log an error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    // Add to in-memory storage
    this.errors.push(errorLog);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorLog);
    }

    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: context.fatal || false
      });
    }

    // Store in localStorage for debugging
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      storedErrors.push(errorLog);
      // Keep only last 50 errors in localStorage
      if (storedErrors.length > 50) {
        storedErrors.shift();
      }
      localStorage.setItem('app_errors', JSON.stringify(storedErrors));
    } catch (e) {
      // Ignore localStorage errors
    }

    return errorLog;
  }

  /**
   * Log a warning
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  logWarning(message, context = {}) {
    const warning = {
      type: 'warning',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning:', warning);
    }

    if (window.gtag) {
      window.gtag('event', 'warning', {
        message,
        ...context
      });
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  logInfo(message, context = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Info:', message, context);
    }

    if (window.gtag) {
      window.gtag('event', 'info', {
        message,
        ...context
      });
    }
  }

  /**
   * Get all tracked errors
   * @returns {Array} - Array of error logs
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear all tracked errors
   */
  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('app_errors');
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Get errors from localStorage
   * @returns {Array} - Array of stored errors
   */
  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch (e) {
      return [];
    }
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  errorTracker.logError(event.error || new Error(event.message), {
    type: 'uncaught_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    fatal: true
  });
});

/**
 * Global unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  errorTracker.logError(
    new Error(event.reason?.message || 'Unhandled Promise Rejection'),
    {
      type: 'unhandled_rejection',
      reason: event.reason,
      fatal: false
    }
  );
});

/**
 * Helper function to wrap async functions with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} context - Error context
 * @returns {Function} - Wrapped function
 */
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.logError(error, {
        ...context,
        functionName: fn.name
      });
      throw error;
    }
  };
};

/**
 * Helper to safely execute code with error boundary
 * @param {Function} fn - Function to execute
 * @param {Function} fallback - Fallback function if error occurs
 * @param {Object} context - Error context
 */
export const safeExecute = async (fn, fallback = () => {}, context = {}) => {
  try {
    return await fn();
  } catch (error) {
    errorTracker.logError(error, context);
    return fallback(error);
  }
};

export default errorTracker;
