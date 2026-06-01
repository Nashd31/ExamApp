/**
 * Storage Service
 * Handles localStorage operations safely with error handling
 */

import { logInfo, logError } from './logger';
import config from './config';


// Prepends a predefined application prefix to a storage key to prevent collisions.
const prefixKey = (key) => `${config.STORAGE_PREFIX}${key}`;


// Safely serializes and saves an item to localStorage.
const setItem = (key, value) => {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(prefixKey(key), serialized);
        logInfo(`Storage: Set item "${key}"`);
        return true;
    } catch (error) {
        logError(`Storage: Failed to set item "${key}"`, error.message);
        return false;
    }
};

// Safely retrieves and deserializes an item from localStorage.
const getItem = (key) => {
    try {
        const serialized = localStorage.getItem(prefixKey(key));
        if (serialized === null) {
            return null;
        }
        const value = JSON.parse(serialized);
        logInfo(`Storage: Retrieved item "${key}"`);
        return value;
    } catch (error) {
        logError(`Storage: Failed to get item "${key}"`, error.message);
        return null;
    }
};

// Removes an item from localStorage.
const removeItem = (key) => {
    try {
        localStorage.removeItem(prefixKey(key));
        logInfo(`Storage: Removed item "${key}"`);
        return true;
    } catch (error) {
        logError(`Storage: Failed to remove item "${key}"`, error.message);
        return false;
    }
};


// Clears all storage items that belong to this application (matching the predefined prefix).
const clear = () => {
    try {
        const keys = Object.keys(localStorage);
        const appKeys = keys.filter((k) => k.startsWith(config.STORAGE_PREFIX));
        appKeys.forEach((key) => localStorage.removeItem(key));
        logInfo(`Storage: Cleared ${appKeys.length} app items`);
        return true;
    } catch (error) {
        logError('Storage: Failed to clear storage', error.message);
        return false;
    }
};

export { setItem, getItem, removeItem, clear };
