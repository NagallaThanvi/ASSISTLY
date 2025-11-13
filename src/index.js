import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import App from './App';

// Log app initialization
console.log('🚀 Assistly app initializing...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Firebase Config:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✓ Loaded' : '✗ Missing');

const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('✓ App rendered successfully');
} catch (error) {
  console.error('✗ App rendering failed:', error);
  // Display error to user
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #fff3cd; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; padding: 20px;">
        <div style="max-width: 500px; text-align: center;">
          <h1 style="color: #856404; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #856404; margin-bottom: 16px;">Failed to load the application. Please:</p>
          <ul style="text-align: left; color: #856404; margin-bottom: 16px;">
            <li>Refresh the page (F5 or Cmd+R)</li>
            <li>Clear browser cache (Ctrl+Shift+Delete)</li>
            <li>Check your internet connection</li>
            <li>Open DevTools (F12) and check the Console for errors</li>
          </ul>
          <button onclick="location.reload()" style="padding: 10px 20px; background-color: #ffc107; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Reload Page</button>
        </div>
      </div>
    `;
  }
}

