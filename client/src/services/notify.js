/**
 * Notification Service
 * Provides notification functions using browser alert()
 * Can be easily replaced with Bootstrap Toasts later
 */

import { logInfo, logError } from './logger';


// Displays a success notification.
const showSuccess = (message) => {
    logInfo(`Notification: Success - ${message}`);
    alert(`✅ ${message}`);
};


// Displays an error notification.
const showError = (message) => {
    logError(`Notification: Error - ${message}`);
    alert(`❌ ${message}`);
};


// Displays an informational notification.
const showInfo = (message) => {
    logInfo(`Notification: Info - ${message}`);
    alert(`ℹ️ ${message}`);
};


// Displays a warning notification.
const showWarn = (message) => {
    logInfo(`Notification: Warning - ${message}`);
    alert(`⚠️ ${message}`);
};

export { showSuccess, showError, showInfo, showWarn };
