import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authLogin, register as authRegister } from '../services/authService';
import { getItem, setItem, removeItem } from '../services/storage';
import { logError } from '../services/logger';
import { AuthContext } from '../hooks/useAuth';

/**
 * Provides authentication state and methods (login, register, logout) to the component tree.
 * Initializes user state from local storage.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    // Initialize user state from persistent storage
    const [user, setUser] = useState(() => getItem('user'));


    // Authenticates a user and updates global state and storage.
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


    // Registers a new user and automatically logs them in.
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

    // Clears user session from state and storage, then redirects to login.
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
