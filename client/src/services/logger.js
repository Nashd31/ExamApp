/**
 * Logger Service
 * Provides logging functions with timestamp formatting
 */

// Generates a formatted current timestamp string (HH:MM:SS) for log messages.
const formatTimestamp = () => {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
};


// Logs an informational message to the console.
const logInfo = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] ℹ️  INFO:`, message, data || '');
};


// Logs a warning message to the console.
const logWarn = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.warn(`[${timestamp}] ⚠️  WARN:`, message, data || '');
};

// Logs an error message to the console.
const logError = (message, data = null) => {
    const timestamp = formatTimestamp();
    console.error(`[${timestamp}] ❌ ERROR:`, message, data || '');
};

export { logInfo, logWarn, logError };
