import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showError } from '../services/notify';

/**
 * Renders the login page allowing users to authenticate.
 * Redirects authenticated users to their respective dashboards based on their role.
 */
const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    /**
     * Handles the login form submission.
     * Attempts to log in the user and navigates upon success, or displays an error.
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const user = await login(email, password);
            if (user.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (error) {
            showError(error.message || 'Invalid credentials');
        }
    };

    return (
        <div className="container login-container">
            <style>{`
                .login-container {
                    animation: slideUpFade 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: calc(100vh - 150px);
                }
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .login-card {
                    background: rgba(255, 255, 255, 0.65) !important;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                    box-shadow: 0 15px 35px rgba(30, 41, 59, 0.08) !important;
                    border-radius: 20px !important;
                    max-width: 420px;
                    width: 100%;
                }
                .login-logo-emblem {
                    background: linear-gradient(135deg, #5b7cfa, #3b82f6);
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px auto;
                    box-shadow: 0 8px 16px rgba(91, 124, 250, 0.25);
                }
                .input-icon-wrapper {
                    position: relative;
                }
                .input-icon-wrapper svg {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    transition: color 0.3s ease;
                }
                .input-icon-wrapper .form-control {
                    padding-left: 38px;
                    height: 42px;
                    border-radius: 10px;
                    border: 1px solid #cbd5e1;
                    background: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                .input-icon-wrapper .form-control:focus {
                    border-color: #5b7cfa;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(91, 124, 250, 0.15);
                }
                .input-icon-wrapper .form-control:focus + svg {
                    color: #5b7cfa;
                }
                .btn-login {
                    height: 42px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    transition: all 0.3s ease;
                }
                .btn-login:hover {
                    transform: translateY(-1.5px);
                    box-shadow: 0 6px 12px rgba(91, 124, 250, 0.2);
                }
                .btn-login:active {
                    transform: translateY(0);
                }
            `}</style>

            <div className="card login-card px-4 py-4">
                <div className="card-body p-2">
                    {/* SVG Emblem Logo */}
                    <div className="login-logo-emblem">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>

                    <h3 className="fw-bold text-center text-dark mb-1 fs-4">Welcome Back</h3>
                    <p className="text-muted text-center mb-3 small">Please enter your details to sign in</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-2">
                            <label htmlFor="email" className="form-label small fw-semibold text-secondary mb-1">
                                Email Address
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="email"
                                    id="email"
                                    className="form-control"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                        </div>
                        <div className="mb-2">
                            <label htmlFor="password" className="form-label small fw-semibold text-secondary mb-1">
                                Password
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-login w-100 mt-2 mb-2">
                            Sign In
                        </button>
                    </form>

                    <p className="text-center text-muted mb-0 small mt-2">
                        Don't have an account? <Link to="/register" className="text-primary fw-semibold text-decoration-none">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
