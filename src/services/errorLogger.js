/**
 * Production Error Logging Service
 * 
 * Centralized error logging with support for multiple backends:
 * - Console (development)
 * - Sentry (optional - for production monitoring)
 * - Custom API endpoint
 * 
 * Usage:
 *   import { logError, logWarning, logInfo } from './services/errorLogger';
 *   try { ... } catch (error) { logError(error, { context: 'UserProfile' }); }
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = process.env.REACT_APP_DEBUG_MODE === 'true';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Log an error with context
 * @param {Error|string} error - The error object or message
 * @param {Object} context - Additional context (component, user, action, etc.)
 * @param {string} severity - Error severity level
 */
export const logError = (error, context = {}, severity = ErrorSeverity.ERROR) => {
  const errorData = formatErrorData(error, context, severity);
  
  // Always log to console in development
  if (isDevelopment || isDebugMode) {
    console.error('🔴 Error:', errorData);
  }
  
  // Send to production monitoring service
  if (!isDevelopment) {
    sendToMonitoringService(errorData);
  }
  
  // Store critical errors locally for debugging
  if (severity === ErrorSeverity.FATAL || severity === ErrorSeverity.ERROR) {
    storeErrorLocally(errorData);
  }
  
  return errorData;
};

/**
 * Log a warning
 */
export const logWarning = (message, context = {}) => {
  return logError(message, context, ErrorSeverity.WARNING);
};

/**
 * Log informational message
 */
export const logInfo = (message, context = {}) => {
  if (isDevelopment || isDebugMode) {
    console.info('ℹ️ Info:', message, context);
  }
};

/**
 * Log debug information (only in debug mode)
 */
export const logDebug = (message, context = {}) => {
  if (isDebugMode) {
    console.debug('🐛 Debug:', message, context);
  }
};

/**
 * Format error data for logging
 */
const formatErrorData = (error, context, severity) => {
  const timestamp = new Date().toISOString();
  
  // Handle both Error objects and string messages
  const errorInfo = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : {
    message: String(error),
    stack: null,
    name: 'CustomError'
  };
  
  return {
    ...errorInfo,
    severity,
    timestamp,
    context: {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine
    },
    environment: process.env.NODE_ENV,
    appVersion: process.env.REACT_APP_VERSION || '1.0.0'
  };
};

/**
 * Send error to monitoring service (Sentry, LogRocket, custom API, etc.)
 */
const sendToMonitoringService = async (errorData) => {
  try {
    // Option 1: Send to Sentry (uncomment if you set up Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorData);
    // }
    
    // Option 2: Send to custom API endpoint
    const apiEndpoint = process.env.REACT_APP_ERROR_LOGGING_ENDPOINT;
    if (apiEndpoint) {
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Silently fail if logging endpoint is unavailable
      });
    }
    
    // Option 3: Send to Firebase Analytics (if enabled)
    if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorData.message,
        fatal: errorData.severity === ErrorSeverity.FATAL
      });
    }
  } catch (loggingError) {
    // Don't throw if logging fails - this would create an infinite loop
    console.error('Failed to send error to monitoring service:', loggingError);
  }
};

/**
 * Store error in localStorage for offline debugging
 */
const storeErrorLocally = (errorData) => {
  try {
    const MAX_STORED_ERRORS = 50;
    const storageKey = 'assistly_error_logs';
    
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    stored.push(errorData);
    
    // Keep only the last N errors
    const trimmed = stored.slice(-MAX_STORED_ERRORS);
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch (storageError) {
    // localStorage might be full or disabled
    console.warn('Could not store error locally:', storageError);
  }
};

/**
 * Get stored errors from localStorage (for debugging)
 */
export const getStoredErrors = () => {
  try {
    return JSON.parse(localStorage.getItem('assistly_error_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored errors
 */
export const clearStoredErrors = () => {
  try {
    localStorage.removeItem('assistly_error_logs');
    return true;
  } catch {
    return false;
  }
};

/**
 * Performance monitoring helper
 */
export const measurePerformance = (operationName, callback) => {
  const startTime = performance.now();
  
  try {
    const result = callback();
    
    // Handle promises
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        logPerformance(operationName, duration);
      });
    }
    
    const duration = performance.now() - startTime;
    logPerformance(operationName, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logError(error, { operation: operationName, duration });
    throw error;
  }
};

/**
 * Log performance metrics
 */
const logPerformance = (operationName, duration) => {
  if (duration > 1000) {
    logWarning(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
  } else if (isDebugMode) {
    logDebug(`Performance: ${operationName} took ${duration.toFixed(2)}ms`);
  }
};

/**
 * Network error handler with retry logic
 */
export const handleNetworkError = async (error, retryCallback, maxRetries = 3) => {
  const isNetworkError = 
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.code === 'NETWORK_ERROR' ||
    !navigator.onLine;
  
  if (isNetworkError && retryCallback && maxRetries > 0) {
    logWarning(`Network error, retrying... (${maxRetries} attempts left)`, { error: error.message });
    
    // Exponential backoff
    const delay = Math.pow(2, 3 - maxRetries) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      return await retryCallback();
    } catch (retryError) {
      return handleNetworkError(retryError, retryCallback, maxRetries - 1);
    }
  }
  
  logError(error, { isNetworkError, online: navigator.onLine });
  throw error;
};

export default {
  logError,
  logWarning,
  logInfo,
  logDebug,
  getStoredErrors,
  clearStoredErrors,
  measurePerformance,
  handleNetworkError,
  ErrorSeverity
};
