import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        // Redirect based on role if they are already logged in
        if (user.role === 'teacher') {
            return <Navigate to="/teacher" replace />;
        }
        if (user.role === 'student') {
            return <Navigate to="/student" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;