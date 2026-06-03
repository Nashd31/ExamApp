import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SettingsModal from './SettingsModal';

/**
 * Modernized Navigation Bar component.
 * Displays appropriate glassmorphic styling and links depending on authentication.
 * Includes user profile initial badge and transitions.
 */
const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Hide navbar completely while taking an exam
    if (location.pathname.startsWith('/take-exam')) {
        return null;
    }

    const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '';
    const avatarGradient = 'var(--theme-gradient)';
    const avatarContent = user?.avatar && user.avatar !== 'initials' ? user.avatar : firstLetter;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark modern-navbar px-4 py-3">
            <style>{`
                .modern-navbar {
                    background: rgba(15, 23, 42, 0.88) !important;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                }

                .navbar-logo-emblem {
                    background: linear-gradient(135deg, #6366f1, #3b82f6);
                    width: 40px;
                    height: 40px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
                }

                .navbar-brand-text {
                    font-weight: 700;
                    letter-spacing: 0px;
                    font-size: 22px;
                    background: linear-gradient(to right, #ffffff, #e2e8f0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .navbar-toggler {
                    border: none !important;
                    background: rgba(255, 255, 255, 0.06) !important;
                    padding: 6px 10px !important;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .navbar-toggler:focus {
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
                }

                .modern-nav-link {
                    font-weight: 500;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7) !important;
                    transition: all 0.2s ease;
                    padding: 8px 16px !important;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .modern-nav-link:hover {
                    color: #ffffff !important;
                    background: rgba(255, 255, 255, 0.06);
                }
                .modern-nav-link.active {
                    color: #ffffff !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    font-weight: 600;
                }

                .user-avatar-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 4px 12px 4px 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    flex-shrink: 0;
                }
                
                .user-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-weight: 800;
                    font-size: 16px;
                    border: 1.5px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    flex-shrink: 0;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.2;
                }
                .user-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #f8fafc;
                }
                .user-role {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #94a3b8;
                }

                .btn-logout {
                    font-size: 16px;
                    font-weight: 600;
                    border: 1px solid rgba(239, 68, 68, 0.3) !important;
                    background: rgba(239, 68, 68, 0.08) !important;
                    color: #fca5a5 !important;
                    padding: 6px 14px !important;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .btn-logout:hover {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                    border-color: #ef4444 !important;
                    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
                }

                .btn-login-nav {
                    font-size: 16px;
                    font-weight: 600;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    background: transparent !important;
                    color: #f1f5f9 !important;
                    padding: 6px 16px !important;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .btn-login-nav:hover {
                    background: #ffffff !important;
                    color: #0f172a !important;
                    border-color: #ffffff !important;
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
                }

                @media (max-width: 991px) {
                    .navbar-collapse {
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
                    }
                    .modern-nav-link {
                        margin-bottom: 4px;
                    }
                    .user-avatar-badge {
                        align-self: flex-start;
                        margin: 8px 0;
                    }
                    .btn-logout {
                        align-self: flex-start;
                        margin-top: 6px;
                        width: 100%;
                        text-align: center;
                    }
                    .btn-login-nav {
                        align-self: flex-start;
                        width: 100%;
                        text-align: center;
                    }
                }
            `}</style>

            <div className="container-fluid px-2">
                <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
                    <div className="navbar-logo-emblem">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                        </svg>
                    </div>
                    <span className="navbar-brand-text">E-Test System</span>
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
                    <ul className="navbar-nav ms-auto align-items-center gap-2 w-100 justify-content-end">
                        {user?.role === 'teacher' && (
                            <li className="nav-item">
                                <NavLink
                                    className={({ isActive }) =>
                                        isActive ? 'modern-nav-link active' : 'modern-nav-link'
                                    }
                                    to="/teacher"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="9" y1="3" x2="9" y2="21" />
                                        <line x1="15" y1="3" x2="15" y2="21" />
                                        <line x1="3" y1="9" x2="21" y2="9" />
                                        <line x1="3" y1="15" x2="21" y2="15" />
                                    </svg>
                                    Teacher Dashboard
                                </NavLink>
                            </li>
                        )}
                        {user?.role === 'student' && (
                            <li className="nav-item">
                                <NavLink
                                    className={({ isActive }) =>
                                        isActive ? 'modern-nav-link active' : 'modern-nav-link'
                                    }
                                    to="/student"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Student Portal
                                </NavLink>
                            </li>
                        )}

                        {user && (
                            <li className="nav-item ms-lg-2">
                                <div className="user-avatar-badge" style={{ cursor: 'pointer' }} onClick={() => setIsSettingsOpen(true)}>
                                    <div className="user-avatar" style={{ background: avatarGradient }}>
                                        {avatarContent}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-role">{user.role}</span>
                                    </div>
                                </div>
                            </li>
                        )}

                        {!user ? (
                            <li className="nav-item ms-lg-2">
                                <Link
                                    className="btn btn-login-nav"
                                    to="/login"
                                >
                                    Login
                                </Link>
                            </li>
                        ) : (
                            <li className="nav-item ms-lg-2">
                                <button className="btn btn-logout" onClick={logout}>
                                    Logout
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </nav>
    );
};

export default Navbar;
