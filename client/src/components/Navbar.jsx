import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Main navigation bar component.
 * Displays appropriate navigation links based on user authentication status and role.
 * Automatically hides on exam-taking pages to prevent distraction/navigation.
 */
const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Hide navbar completely while taking an exam
    if (location.pathname.startsWith('/take-exam')) {
        return null;
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-3">
            <div className="container-fluid">
                <NavLink className="navbar-brand fs-3" to="/">
                    E-Test System
                </NavLink>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {user && (
                    <div className="position-absolute top-50 start-50 translate-middle d-none d-lg-block">
                        <span className="navbar-text text-light">
                            Hello, {user.name}
                        </span>
                    </div>
                )}
                
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center gap-1">
                        {user && (
                            <li className="nav-item d-block d-lg-none text-light my-2">
                                Hello, {user.name}
                            </li>
                        )}
                        {user?.role === 'teacher' && (
                            <li className="nav-item mb-2">
                                <NavLink
                                    className={({ isActive }) =>
                                        isActive ? 'nav-link active' : 'nav-link'
                                    }
                                    to="/teacher"
                                >
                                    Teacher Dashboard
                                </NavLink>
                            </li>
                        )}
                        {user?.role === 'student' && (
                            <li className="nav-item">
                                <NavLink
                                    className={({ isActive }) =>
                                        isActive ? 'nav-link active' : 'nav-link'
                                    }
                                    to="/student"
                                >
                                    Student Portal
                                </NavLink>
                            </li>
                        )}
                        {!user && (
                            <li className="nav-item">
                                <Link
                                    className="btn btn-outline-light ms-2"
                                    to="/login"
                                >
                                    Login
                                </Link>
                            </li>
                        )}
                        {user && (
                            <>
                                <li className="nav-item">
                                    <button className="btn btn-outline-light ms-2" onClick={logout}>
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
