/**
 * Application Configuration Service
 * Central location for app constants and configuration values
 */

const config = {
    APP_NAME: 'E-Test System',
    VERSION: '1.0.0',
    MOCK_API_DELAY: 500,
    STORAGE_PREFIX: 'examApp_',
    API_TIMEOUT: 5000,
    MAX_RETRIES: 3,
    USE_SERVER_API: true,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://examappserver.onrender.com/api',
};

export default config;
