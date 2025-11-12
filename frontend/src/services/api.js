import axios from 'axios';

// Detectar si estamos en producción o desarrollo
const getApiUrl = () => {
  // Si está definido en env, usarlo (tiene prioridad)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Detectar por hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Si es localhost real, usar localhost:3001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // Para cualquier otro dominio (producción), usar el mismo dominio con /api
  // Esto incluye facturandozen.com y cualquier otro dominio
  return `${protocol}//${hostname}/api`;
};

const apiUrl = getApiUrl();

// Log para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL configurada:', apiUrl);
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error:', error.response?.status, error.config?.url, error.message);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
