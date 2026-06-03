import mockDb, { saveToStorage } from './mockDb.js';
import config from '../services/config.js';

const DELAY = config.MOCK_API_DELAY;
const BASE_URL = config.API_BASE_URL;

// Helper to standardise responses and propagate backend errors properly to caller
const handleResponse = async (res) => {
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    if (res.status === 204) return;
    return res.json();
};

// Utility function to strip the password from a user object before returning it.
const omitPassword = (user) => {
    const userCopy = { ...user };
    delete userCopy.password;
    return userCopy;
};


// Authenticates a user with their email and password (via API or mockDb fallback).
export const login = (email, password) => {
    if (config.USE_SERVER_API) {
        return fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).then(handleResponse);
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockDb.users.find(
                (u) => u.email === email && u.password === password
            );

            if (user) {
                resolve(omitPassword(user));
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, DELAY);
    });
};

/**
 * Registers a new user (via API or mockDb fallback).
 */
export const register = (name, email, password, role) => {
    if (config.USE_SERVER_API) {
        return fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        }).then(handleResponse);
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const exists = mockDb.users.some((u) => u.email === email);
            if (exists) {
                reject(new Error('Email already exists'));
                return;
            }

            const newUser = {
                id: `u${Date.now()}`,
                name,
                email,
                password,
                role,
                ...(role === 'student' ? { enrolledCourses: [] } : {})
            };

            mockDb.users.push(newUser);
            saveToStorage(mockDb);
            resolve(omitPassword(newUser));
        }, DELAY);
    });
};

/**
 * Updates a user profile (via API or mockDb fallback).
 */
export const updateUserProfile = (userId, name, password, avatar, themeColor) => {
    if (config.USE_SERVER_API) {
        return fetch(`${BASE_URL}/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password, avatar, themeColor })
        }).then(handleResponse);
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const userIndex = mockDb.users.findIndex((u) => u.id === userId);
            if (userIndex === -1) {
                return reject(new Error('User not found'));
            }

            const user = mockDb.users[userIndex];
            user.name = name;
            if (password) {
                user.password = password;
            }
            user.avatar = avatar;
            user.themeColor = themeColor;

            saveToStorage(mockDb);
            resolve(omitPassword(user));
        }, DELAY);
    });
};
