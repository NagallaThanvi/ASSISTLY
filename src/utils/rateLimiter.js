/**
 * Rate Limiter Utility
 * 
 * Prevents abuse by limiting the number of times a function can be called
 * within a specific time window.
 * 
 * Usage:
 *   const limiter = new RateLimiter(5, 60000); // 5 calls per minute
 *   if (limiter.tryAcquire('user123')) {
 *     // Proceed with API call
 *   } else {
 *     // Show "too many requests" error
 *   }
 */

import React from 'react';

class RateLimiter {
  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // key -> array of timestamps
  }

  /**
   * Try to acquire a token for rate limiting
   * @param {string} key - Identifier (userId, IP, endpoint, etc.)
   * @returns {boolean} - true if request is allowed, false if rate limited
   */
  tryAcquire(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];
    
    // Remove expired timestamps
    keyRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (keyRequests.length >= this.maxRequests) {
      this.requests.set(key, keyRequests);
      return false;
    }
    
    // Add current request
    keyRequests.push(now);
    this.requests.set(key, keyRequests);
    
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param {string} key - Identifier
   * @returns {number} - Number of requests remaining
   */
  getRemaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyRequests = (this.requests.get(key) || [])
      .filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - keyRequests.length);
  }

  /**
   * Get time until rate limit resets
   * @param {string} key - Identifier
   * @returns {number} - Milliseconds until reset
   */
  getResetTime(key) {
    const keyRequests = this.requests.get(key) || [];
    if (keyRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...keyRequests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * Clear rate limit for a key
   * @param {string} key - Identifier
   */
  clear(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.requests.clear();
  }

  /**
   * Cleanup old entries periodically
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(timestamp => timestamp > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

// Create singleton instances for common use cases
export const apiRateLimiter = new RateLimiter(
  parseInt(process.env.REACT_APP_MAX_REQUESTS_PER_MINUTE) || 60,
  60000 // 1 minute
);

export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const searchRateLimiter = new RateLimiter(30, 60000); // 30 searches per minute
export const chatbotRateLimiter = new RateLimiter(20, 60000); // 20 messages per minute

// Cleanup old entries every 5 minutes
setInterval(() => {
  apiRateLimiter.cleanup();
  authRateLimiter.cleanup();
  searchRateLimiter.cleanup();
  chatbotRateLimiter.cleanup();
}, 300000);

/**
 * Higher-order function to wrap an async function with rate limiting
 * @param {Function} fn - Async function to wrap
 * @param {RateLimiter} limiter - Rate limiter instance
 * @param {Function} getKey - Function to extract key from arguments
 * @returns {Function} - Rate-limited function
 */
export const withRateLimit = (fn, limiter, getKey = () => 'default') => {
  return async (...args) => {
    const key = getKey(...args);
    
    if (!limiter.tryAcquire(key)) {
      const resetTime = Math.ceil(limiter.getResetTime(key) / 1000);
      throw new Error(
        `Rate limit exceeded. Please try again in ${resetTime} seconds.`
      );
    }
    
    return await fn(...args);
  };
};

/**
 * React hook for rate limiting
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - { canProceed, remaining, resetIn }
 */
export const useRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const [limiter] = React.useState(() => new RateLimiter(maxRequests, windowMs));
  const [remaining, setRemaining] = React.useState(maxRequests);
  const [resetIn, setResetIn] = React.useState(0);
  
  const checkLimit = React.useCallback((key = 'default') => {
    const canProceed = limiter.tryAcquire(key);
    setRemaining(limiter.getRemaining(key));
    setResetIn(limiter.getResetTime(key));
    return canProceed;
  }, [limiter]);
  
  return { checkLimit, remaining, resetIn };
};

export default RateLimiter;
