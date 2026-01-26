import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

if (import.meta.env.DEV) {
  console.log('🚀 Developer Mode Active');
  console.log('💡 Type "enableLogs()" in the console to persist verbose debugging.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
