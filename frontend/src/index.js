import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { THEME } from './theme/designSystem';

// Global reset styles - Professional Minimal Theme
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: ${THEME.colors.background.primary};
    color: ${THEME.colors.gray[900]};
    font-family: ${THEME.Typography.fontFamily};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input, select, textarea, button {
    font-family: inherit;
  }
  button {
    cursor: pointer;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: ${THEME.colors.gray[100]};
  }
  ::-webkit-scrollbar-thumb {
    background: ${THEME.colors.gray[300]};
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${THEME.colors.gray[400]};
  }
  
  /* Table hover effect */
  table tbody tr:hover {
    background: ${THEME.colors.gray[50]};
  }
  
  /* Form elements focus states */
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: ${THEME.colors.blue[500]};
    box-shadow: 0 0 0 3px ${THEME.colors.blue[50]};
  }
  
  /* Button hover effect */
  button:hover:not(:disabled) {
    opacity: 0.95;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
