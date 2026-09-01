/**
 * Application Configuration Service
 * Central location for app constants and configuration values
 */

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const config = {
    APP_NAME: 'E-Test System',
    VERSION: '1.0.0',
    MOCK_API_DELAY: 500,
    STORAGE_PREFIX: 'examApp_',
    API_TIMEOUT: 5000,
    MAX_RETRIES: 3,
    USE_SERVER_API: import.meta.env.VITE_USE_SERVER_API === 'true',
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
                  (isLocal ? 'http://localhost:5000/api' : 'https://examappserver.onrender.com/api'),
};

export default config;
