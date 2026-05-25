/**
 * Notification Service
 * Provides notification functions using browser alert()
 * Can be easily replaced with Bootstrap Toasts later
 */

import { logInfo, logError } from './logger';

const showSuccess = (message) => {
    logInfo(`Notification: Success - ${message}`);
    alert(`✅ ${message}`);
};

const showError = (message) => {
    logError(`Notification: Error - ${message}`);
    alert(`❌ ${message}`);
};

const showInfo = (message) => {
    logInfo(`Notification: Info - ${message}`);
    alert(`ℹ️ ${message}`);
};

const showWarn = (message) => {
    logInfo(`Notification: Warning - ${message}`);
    alert(`⚠️ ${message}`);
};

export { showSuccess, showError, showInfo, showWarn };
