import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * React Application Entry Point
 * 
 * Concepts explained:
 * 1. ReactDOM.createRoot: React 18 concurrent root rendering API
 * 2. React.StrictMode: Highlights potential problems and side-effects during development
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
