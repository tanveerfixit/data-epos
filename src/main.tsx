import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to attach JWT token and handle 401 Unauthorized globally
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    const token = localStorage.getItem('epos_token');
    if (token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  try {
    const response = await originalFetch(resource, config);
    if (response.status === 401 && typeof resource === 'string' && !resource.includes('/api/auth/login') && !resource.includes('/api/auth/me')) {
      localStorage.removeItem('epos_token');
      window.location.href = '/';
      // Return a mock successful empty array response to prevent frontend rendering crashes (e.g. .map fails) before redirect
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
