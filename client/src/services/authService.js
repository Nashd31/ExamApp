import mockDb, { saveToStorage } from '../api/mockDb.js';

const DELAY = 500;

const omitPassword = ({ password, ...user }) => user;

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
