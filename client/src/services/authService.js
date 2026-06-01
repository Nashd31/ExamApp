import mockDb, { saveToStorage } from '../api/mockDb.js';
import config from './config.js';

const DELAY = config.MOCK_API_DELAY;


// Utility function to strip the password from a user object before returning it.
const omitPassword = ({ password, ...user }) => user;


// Simulates an API call to authenticate a user with their email and password.
export const login = (email, password) => {
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
 * Simulates an API call to register a new user.
 * Checks for existing emails to prevent duplicates.
 */
export const register = (name, email, password, role) => {
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
            };

            mockDb.users.push(newUser);
            saveToStorage(mockDb);
            resolve(omitPassword(newUser));
        }, DELAY);
    });
};
