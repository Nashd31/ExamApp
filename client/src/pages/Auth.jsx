import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Auth component combines Login and Register pages into a single dual-pane card.
 * Uses CSS transitions to slide an overlay cover between Left and Right halves.
 * Adapts to mobile screen sizes by displaying a single form with a toggle link.
 */
const Auth = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active form side based on route path
    const isRegister = location.pathname === '/register';

    // State for local error display
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [prevPath, setPrevPath] = useState(location.pathname);

    // Reset error and loading states when pathname changes during render phase
    // to prevent hook cascading render warnings in useEffect
    if (location.pathname !== prevPath) {
        setPrevPath(location.pathname);
        setError('');
        setLoading(false);
    }

    // Form inputs state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [regRole, setRegRole] = useState('student');

    /**
     * Handles Login submit action.
     */
    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(loginEmail, loginPassword);
            if (user.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials');
            setLoading(false);
        }
    };

    /**
     * Handles Register submit action.
     */
    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!regName || !regName.trim()) {
            setError('Name is required and cannot be empty.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regEmail || !emailRegex.test(regEmail)) {
            setError('Invalid email address format.');
            return;
        }

        if (!regPassword || regPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (regRole !== 'student' && regRole !== 'teacher') {
            setError('Please select a valid role.');
            return;
        }

        setLoading(true);
        try {
            const user = await register(regName, regEmail, regPassword, regRole);
            if (user.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <style>{`
                .auth-page-container {
                    position: relative;
                    width: 100%;
                    min-height: calc(100vh - 150px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                }

                /* Main glassmorphic wrapper card */
                .auth-card-wrapper {
                    position: relative;
                    z-index: 5;
                    width: 850px;
                    max-width: 100%;
                    height: 550px;
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08),
                                0 25px 50px -5px rgba(0, 0, 0, 0.12),
                                0 1px 3px rgba(0, 0, 0, 0.05),
                                0 0 0 1px rgba(255, 255, 255, 0.25) inset;
                    overflow: hidden;
                    display: flex;
                    transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .auth-panel {
                    width: 50%;
                    height: 100%;
                    padding: 30px 45px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }

                .panel-register {
                    opacity: 1;
                }
                .panel-login {
                    opacity: 1;
                }

                /* Forms brand elements */
                .brand-logo {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .brand-logo.blue-theme {
                    background: linear-gradient(135deg, #4f46e5, #3b82f6);
                    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.2);
                }
                .brand-logo.green-theme {
                    background: linear-gradient(135deg, #10b981, #059669);
                    box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2);
                }

                .panel-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 2px;
                }
                .panel-subtitle {
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 16px;
                }

                /* Compact input spacing to prevent overflow */
                .form-group-compact {
                    margin-bottom: 3px;
                }

                .input-icon-wrapper {
                    position: relative;
                }
                .input-icon-wrapper > svg {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    transition: color 0.3s ease;
                }
                .password-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    padding: 0;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s ease;
                    z-index: 10;
                }
                .password-toggle-btn:hover {
                    color: #475569;
                }
                .input-icon-wrapper .form-control {
                    padding-left: 36px;
                    height: 38px;
                    border-radius: 9px;
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    background: rgba(255, 255, 255, 0.7);
                    font-size: 13.5px;
                    transition: all 0.3s ease;
                }
                .input-icon-wrapper .form-control:focus {
                    border-color: #4f46e5;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
                }
                .panel-register .input-icon-wrapper .form-control:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
                }
                .input-icon-wrapper .form-control:focus + svg {
                    color: #4f46e5;
                }
                .panel-register .input-icon-wrapper .form-control:focus + svg {
                    color: #10b981;
                }

                /* Custom role toggle */
                .role-segmented-control {
                    display: flex;
                    background: rgba(148, 163, 184, 0.08);
                    border-radius: 9px;
                    padding: 2.5px;
                    border: 1px solid rgba(148, 163, 184, 0.12);
                }
                .role-option {
                    flex: 1;
                    text-align: center;
                    padding: 5px 8px;
                    cursor: pointer;
                    border-radius: 6.5px;
                    font-weight: 600;
                    font-size: 12.5px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    color: #64748b;
                    user-select: none;
                }
                .role-option:hover {
                    color: #10b981;
                }
                .role-option.active {
                    background: #ffffff;
                    color: #10b981;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
                }
                .role-option.active svg {
                    color: #10b981;
                }

                .btn-auth {
                    height: 38px;
                    border-radius: 9px;
                    font-weight: 600;
                    font-size: 13.5px;
                    letter-spacing: 0.3px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .btn-auth-login {
                    background: linear-gradient(135deg, #4f46e5, #3b82f6);
                    border: none;
                    color: white;
                }
                .btn-auth-login:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 10px rgba(59, 130, 246, 0.2);
                }
                .btn-auth-register {
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    color: white;
                }
                .btn-auth-register:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 10px rgba(16, 185, 129, 0.2);
                }
                .btn-auth:active {
                    transform: translateY(0);
                }

                /* Sliding Overlay Panel */
                .overlay-container {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    width: 50%;
                    height: 100%;
                    overflow: hidden;
                    transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
                    z-index: 100;
                }

                .auth-card-wrapper.mode-login .overlay-container {
                    transform: translateX(-100%);
                }
                .auth-card-wrapper.mode-register .overlay-container {
                    transform: translateX(0);
                }

                .overlay-slider {
                    background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 40%, #10b981 70%, #059669 100%);
                    background-size: 200% 100%;
                    background-position: 0% 0%;
                    color: #ffffff;
                    position: relative;
                    left: -100%;
                    height: 100%;
                    width: 200%;
                    transform: translateX(0);
                    transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1),
                                background-position 0.6s cubic-bezier(0.77, 0, 0.175, 1);
                }

                .auth-card-wrapper.mode-login .overlay-slider {
                    transform: translateX(50%);
                    background-position: 0% 0%;
                }
                .auth-card-wrapper.mode-register .overlay-slider {
                    transform: translateX(0);
                    background-position: 100% 0%;
                }

                .overlay-panel {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 0 45px;
                    text-align: center;
                    top: 0;
                    height: 100%;
                    width: 50%;
                    transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
                }

                .overlay-left {
                    transform: translateX(-20%);
                }
                .auth-card-wrapper.mode-login .overlay-left {
                    transform: translateX(0);
                }

                .overlay-right {
                    right: 0;
                    transform: translateX(0);
                }
                .auth-card-wrapper.mode-login .overlay-right {
                    transform: translateX(20%);
                }

                .overlay-title {
                    font-size: 26px;
                    font-weight: 800;
                    margin-bottom: 10px;
                }
                .overlay-text {
                    font-size: 13.5px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    opacity: 0.9;
                }
                .btn-toggle {
                    border: 2px solid #ffffff;
                    background: transparent;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 13.5px;
                    padding: 8px 24px;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .btn-toggle:hover {
                    background: #ffffff;
                    color: #4f46e5;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
                    transform: translateY(-1.5px);
                }
                .auth-card-wrapper.mode-register .overlay-right .btn-toggle:hover {
                    color: #10b981;
                }

                /* Mobile responsive overrides */
                .mobile-toggle-text {
                    display: none;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                    margin-top: 14px;
                }
                .mobile-toggle-link {
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                }
                .mobile-toggle-link.blue-link { color: #4f46e5; }
                .mobile-toggle-link.green-link { color: #10b981; }

                @media (max-width: 850px) {
                    .auth-page-container {
                        padding: 10px;
                        min-height: calc(100vh - 170px);
                    }
                    .auth-card-wrapper {
                        width: 100%;
                        max-width: 420px;
                        height: auto;
                        flex-direction: column;
                        background: rgba(255, 255, 255, 0.75);
                        border-radius: 20px;
                    }
                    .auth-panel {
                        width: 100%;
                        padding: 35px 24px;
                    }
                    .overlay-container {
                        display: none !important;
                    }
                    .auth-card-wrapper.mode-login .panel-register {
                        display: none !important;
                    }
                    .auth-card-wrapper.mode-register .panel-login {
                        display: none !important;
                    }
                    .mobile-toggle-text {
                        display: block !important;
                    }
                    .auth-submit-wrapper {
                        padding-bottom: 0 !important;
                        margin-top: 12px;
                    }
                    .auth-error-alert {
                        position: static !important;
                        margin-top: 10px;
                    }
                }

                .auth-submit-wrapper {
                    position: relative;
                    margin-top: 14px;
                    padding-bottom: 52px;
                }
                .auth-error-alert {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    margin-bottom: 0 !important;
                    animation: fadeInError 0.2s ease-out;
                }
                @keyframes fadeInError {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>



            {/* Combined Slide Card */}
            <div className={`auth-card-wrapper ${isRegister ? 'mode-register' : 'mode-login'}`}>

                {/* 1. REGISTER FORM PANE (Left Side) */}
                <div className="auth-panel panel-register">
                    <div className="brand-logo green-theme">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h3 className="panel-title">Create Account</h3>
                    <p className="panel-subtitle">Join the E-Test platform today</p>

                    <form onSubmit={handleRegisterSubmit}>
                        <div className="form-group-compact">
                            <label htmlFor="reg-name" className="form-label small fw-semibold text-secondary mb-1">
                                Full Name
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="text"
                                    id="reg-name"
                                    className="form-control"
                                    placeholder="John Doe"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                />
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>

                        <div className="form-group-compact">
                            <label htmlFor="reg-email" className="form-label small fw-semibold text-secondary mb-1">
                                Email Address
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="email"
                                    id="reg-email"
                                    className="form-control"
                                    placeholder="you@example.com"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                />
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                        </div>

                        <div className="form-group-compact">
                            <label htmlFor="reg-password" className="form-label small fw-semibold text-secondary mb-1">
                                Password
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type={showRegPassword ? "text" : "password"}
                                    id="reg-password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                                >
                                    {showRegPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group-compact">
                            <label className="form-label small fw-semibold text-secondary d-block mb-1">
                                Choose Your Role
                            </label>
                            <div className="role-segmented-control">
                                <div
                                    className={`role-option ${regRole === 'student' ? 'active' : ''}`}
                                    onClick={() => setRegRole('student')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                    <span>Student</span>
                                </div>
                                <div
                                    className={`role-option ${regRole === 'teacher' ? 'active' : ''}`}
                                    onClick={() => setRegRole('teacher')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>Teacher</span>
                                </div>
                            </div>
                        </div>

                        <div className="auth-submit-wrapper">
                            <button type="submit" disabled={loading} className="btn btn-primary btn-auth btn-auth-register w-100">
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Registering...
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </button>
                            {error && (
                                <div className="alert alert-danger py-2 px-3 small text-start auth-error-alert">
                                    {error}
                                </div>
                            )}
                        </div>
                    </form>

                    <div className="mobile-toggle-text">
                        Already have an account?{' '}
                        <span onClick={() => navigate('/login')} className="mobile-toggle-link green-link">
                            Sign In
                        </span>
                    </div>
                </div>

                {/* 2. LOGIN FORM PANE (Right Side) */}
                <div className="auth-panel panel-login">
                    <div className="brand-logo blue-theme">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h3 className="panel-title">Welcome Back</h3>
                    <p className="panel-subtitle">Please enter your details to sign in</p>

                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group-compact">
                            <label htmlFor="login-email" className="form-label small fw-semibold text-secondary mb-1">
                                Email Address
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="email"
                                    id="login-email"
                                    className="form-control"
                                    placeholder="you@example.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                />
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                        </div>

                        <div className="form-group-compact">
                            <label htmlFor="login-password" className="form-label small fw-semibold text-secondary mb-1">
                                Password
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type={showLoginPassword ? "text" : "password"}
                                    id="login-password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                >
                                    {showLoginPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="auth-submit-wrapper">
                            <button type="submit" disabled={loading} className="btn btn-primary btn-auth btn-auth-login w-100">
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Signing In...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                            {error && (
                                <div className="alert alert-danger py-2 px-3 small text-start auth-error-alert">
                                    {error}
                                </div>
                            )}
                        </div>
                    </form>

                    <div className="mobile-toggle-text">
                        Don't have an account?{' '}
                        <span onClick={() => navigate('/register')} className="mobile-toggle-link blue-link">
                            Register
                        </span>
                    </div>
                </div>

                {/* 3. SLIDING OVERLAY CONTAINER (Desktop Only) */}
                <div className="overlay-container">
                    <div className="overlay-slider">

                        {/* Slide A (Exposed when overlay is on the left, covering Register, exposing Login on the right) */}
                        <div className="overlay-panel overlay-left">
                            <h2 className="overlay-title">New Here?</h2>
                            <p className="overlay-text">
                                Sign up now to create interactive digital exams or take scheduled tests and track your scores.
                            </p>
                            <button className="btn-toggle" onClick={() => navigate('/register')}>
                                Create Account
                            </button>
                        </div>

                        {/* Slide B (Exposed when overlay is on the right, covering Login, exposing Register on the left) */}
                        <div className="overlay-panel overlay-right">
                            <h2 className="overlay-title">Welcome Back!</h2>
                            <p className="overlay-text">
                                Already registered? Sign in with your existing email and password to access your dashboard.
                            </p>
                            <button className="btn-toggle" onClick={() => navigate('/login')}>
                                Sign In
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Auth;
