/**
 * Notification Service
 * Dispatches styled modal dialogs via browser custom events.
 */

import { logInfo, logError } from './logger';

const callBridge = (variant, message) => {
    // Decoupled dispatch via browser custom events
    const event = new CustomEvent('app:dialog', {
        detail: { variant, message }
    });
    window.dispatchEvent(event);
};

// Displays a success notification.
const showSuccess = (message) => {
    logInfo(`Notification: Success - ${message}`);
    callBridge('success', message);
};

// Displays an error notification.
const showError = (message) => {
    logError(`Notification: Error - ${message}`);
    callBridge('error', message);
};

// Displays an informational notification.
const showInfo = (message) => {
    logInfo(`Notification: Info - ${message}`);
    callBridge('info', message);
};

// Displays a warning notification.
const showWarn = (message) => {
    logInfo(`Notification: Warning - ${message}`);
    callBridge('warn', message);
};

export { showSuccess, showError, showInfo, showWarn };
