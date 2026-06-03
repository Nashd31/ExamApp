import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authLogin, register as authRegister, updateUserProfile as authUpdateUserProfile } from '../api/authService';
import { getItem, setItem, removeItem } from '../services/storage';
import { logError } from '../services/logger';
import { AuthContext } from '../hooks/useAuth';

/**
 * Applies a theme color globally using CSS Custom Properties.
 */
const applyTheme = (themeColor, role) => {
    const colors = {
        indigo: { primary: '#4f46e5', gradient: 'linear-gradient(135deg, #4f46e5, #3b82f6)', glow: 'rgba(79, 70, 229, 0.15)' },
        emerald: { primary: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.15)' },
        crimson: { primary: '#e11d48', gradient: 'linear-gradient(135deg, #e11d48, #be123c)', glow: 'rgba(225, 29, 72, 0.15)' },
        amber: { primary: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.15)' },
        teal: { primary: '#0d9488', gradient: 'linear-gradient(135deg, #0d9488, #0f766e)', glow: 'rgba(13, 148, 136, 0.15)' },
        purple: { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', glow: 'rgba(124, 58, 237, 0.15)' }
    };

    const defaultTheme = role === 'teacher' ? 'emerald' : 'indigo';
    const theme = colors[themeColor] || colors[defaultTheme];
    document.documentElement.style.setProperty('--theme-color', theme.primary);
    document.documentElement.style.setProperty('--theme-gradient', theme.gradient);
    document.documentElement.style.setProperty('--theme-glow', theme.glow);
};

/**
 * Provides authentication state and methods (login, register, logout, updateProfile) to the component tree.
 * Initializes user state from local storage.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    // Initialize user state from persistent storage
    const [user, setUser] = useState(() => getItem('user'));

    // Apply the active theme dynamically on load or whenever user state changes
    useEffect(() => {
        if (user) {
            applyTheme(user.themeColor, user.role);
        } else {
            applyTheme('indigo', 'student');
        }
    }, [user]);

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

    // Updates the authenticated user's profile details and local storage.
    const updateProfile = async (name, password, avatar, themeColor) => {
        try {
            const userData = await authUpdateUserProfile(user.id, name, password, avatar, themeColor);
            setUser(userData);
            setItem('user', userData);
            return userData;
        } catch (error) {
            logError('Auth profile update failed', error.message);
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
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
