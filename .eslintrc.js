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

module.exports = {
  "scripts": {
    "lint": "eslint src --ext .js,.jsx",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "lint:report": "eslint src --ext .js,.jsx --output-file eslint-report.json --format json"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ],
    "rules": {
      // Relax some rules while keeping security intact
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "react-hooks/exhaustive-deps": "warn",
      "no-useless-escape": "warn",
      "import/no-anonymous-default-export": "warn"
    }
  }
};
