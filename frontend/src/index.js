import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; font-family: Inter, system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  input, select, textarea, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }
  a { color: inherit; }
  table tr:hover { background: rgba(99, 102, 241, 0.05); }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
