import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showError } from '../services/notify';

/**
 * Renders the user registration page.
 * Allows new users to create an account and assigns them a specified role.
 */
const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');

    /**
     * Handles the registration form submission.
     * Registers the user, logs them in, and navigates based on their role.
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const user = await register(name, email, password, role);
            if (user.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (error) {
            showError(error.message || 'Registration failed');
        }
    };

    return (
        <div className="container register-container">
            <style>{`
                .register-container {
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
                .register-card {
                    background: rgba(255, 255, 255, 0.65) !important;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                    box-shadow: 0 15px 35px rgba(30, 41, 59, 0.08) !important;
                    border-radius: 20px !important;
                    max-width: 440px;
                    width: 100%;
                }
                .register-logo-emblem {
                    background: linear-gradient(135deg, #10b981, #059669);
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px auto;
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
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
                    border-color: #10b981;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
                }
                .input-icon-wrapper .form-control:focus + svg {
                    color: #10b981;
                }
                .role-segmented-control {
                    display: flex;
                    background: rgba(148, 163, 184, 0.12);
                    border-radius: 10px;
                    padding: 3px;
                    border: 1px solid rgba(148, 163, 184, 0.15);
                }
                .role-option {
                    flex: 1;
                    text-align: center;
                    padding: 7px 10px;
                    cursor: pointer;
                    border-radius: 7px;
                    font-weight: 600;
                    font-size: 13px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    color: #64748b;
                    user-select: none;
                }
                .role-option:hover {
                    color: #10b981;
                }
                .role-option.active {
                    background: #ffffff;
                    color: #10b981;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
                }
                .role-option svg {
                    color: #64748b;
                    transition: color 0.2s ease;
                }
                .role-option.active svg {
                    color: #10b981;
                }
                .btn-register {
                    height: 42px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    background-color: #10b981 !important;
                    border-color: #10b981 !important;
                    transition: all 0.3s ease;
                }
                .btn-register:hover {
                    background-color: #059669 !important;
                    border-color: #059669 !important;
                    transform: translateY(-1.5px);
                    box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2);
                }
                .btn-register:active {
                    transform: translateY(0);
                }
            `}</style>

            <div className="card register-card px-4 py-4">
                <div className="card-body p-2">
                    {/* SVG Emblem Logo */}
                    <div className="register-logo-emblem">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>

                    <h3 className="fw-bold text-center text-dark mb-1 fs-4">Create Account</h3>
                    <p className="text-muted text-center mb-2 small">Join the E-Test platform today</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-2">
                            <label htmlFor="name" className="form-label small fw-semibold text-secondary mb-1">
                                Full Name
                            </label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="text"
                                    id="name"
                                    className="form-control"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>
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
                        <div className="mb-2">
                            <label className="form-label small fw-semibold text-secondary d-block mb-1">
                                Choose Your Role
                            </label>
                            <div className="role-segmented-control">
                                <div
                                    className={`role-option ${role === 'student' ? 'active' : ''}`}
                                    onClick={() => setRole('student')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                    <span>Student</span>
                                </div>
                                <div
                                    className={`role-option ${role === 'teacher' ? 'active' : ''}`}
                                    onClick={() => setRole('teacher')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>Teacher</span>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-register w-100 mt-2 mb-2">
                            Register
                        </button>
                    </form>

                    <p className="text-center text-muted mb-0 small mt-2">
                        Already have an account? <Link to="/login" className="text-success fw-semibold text-decoration-none">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
