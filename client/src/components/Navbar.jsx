import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

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
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center gap-1">
                        <li className="nav-item">
                            <NavLink
                                className={({ isActive }) =>
                                    isActive ? 'nav-link active' : 'nav-link'
                                }
                                to="/"
                            >
                                Home
                            </NavLink>
                        </li>
                        {user?.role === 'teacher' && (
                            <li className="nav-item">
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
                            <>
                                <li className="nav-item">
                                    <NavLink
                                        className={({ isActive }) =>
                                            isActive ? 'nav-link active' : 'nav-link'
                                        }
                                        to="/login"
                                    >
                                        Login
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink
                                        className={({ isActive }) =>
                                            isActive ? 'nav-link active' : 'nav-link'
                                        }
                                        to="/register"
                                    >
                                        Register
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user && (
                            <>
                                <li className="nav-item nav-link text-light">
                                    Hello, {user.name}
                                </li>
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
