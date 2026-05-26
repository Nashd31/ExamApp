import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authLogin, register as authRegister } from '../services/authService';
import { getItem, setItem, removeItem } from '../services/storage';
import { logError } from '../services/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getItem('user'));

    const login = async (email, password) => {
        try {
            const userData = await authLogin(email, password);
            setUser(userData);
            setItem('user', userData);
            return userData;
        } catch (error) {
            logError('Auth login failed', error.message);
            throw error;
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const userData = await authRegister(name, email, password, role);
            setUser(userData);
            setItem('user', userData);
            return userData;
        } catch (error) {
            logError('Auth registration failed', error.message);
            throw error;
        }
    };

    const logout = () => {
        removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
