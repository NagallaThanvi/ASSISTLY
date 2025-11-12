/**
 * Automated ESLint Fixes Script
 * 
 * Run this script to automatically fix common ESLint warnings:
 * - Remove unused imports
 * - Fix missing React Hook dependencies
 * - Remove unused variables
 * 
 * Usage: npm run lint:fix
 */

/**
 * ESLint configuration for the project.
 *
 * Note: package scripts belong in package.json — not in this file.
 */
module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Relax some rules while keeping security intact
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'react-hooks/exhaustive-deps': 'warn',
    'no-useless-escape': 'warn',
    'import/no-anonymous-default-export': 'warn'
  }
};
