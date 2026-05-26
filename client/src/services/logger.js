/**
 * Logger Service
 * Provides logging functions with timestamp formatting
 */

const formatTimestamp = () => {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
};

const logInfo = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] ℹ️  INFO:`, message, data || '');
};

const logWarn = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.warn(`[${timestamp}] ⚠️  WARN:`, message, data || '');
};

const logError = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.error(`[${timestamp}] ❌ ERROR:`, message, data || '');
};

export { logInfo, logWarn, logError };
