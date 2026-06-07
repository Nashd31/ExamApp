import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError } from '../services/notify';

const THEME_COLORS = {
  indigo: { primary: '#4f46e5', gradient: 'linear-gradient(135deg, #4f46e5, #3b82f6)', glow: 'rgba(79, 70, 229, 0.15)' },
  emerald: { primary: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.15)' },
  crimson: { primary: '#e11d48', gradient: 'linear-gradient(135deg, #e11d48, #be123c)', glow: 'rgba(225, 29, 72, 0.15)' },
  amber: { primary: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.15)' },
  teal: { primary: '#0d9488', gradient: 'linear-gradient(135deg, #0d9488, #0f766e)', glow: 'rgba(13, 148, 136, 0.15)' },
  purple: { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', glow: 'rgba(124, 58, 237, 0.15)' }
};

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  // Form states (safe for null user on startup)
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || 'initials');
  const [themeColor, setThemeColor] = useState(user?.themeColor || (user?.role === 'teacher' ? 'emerald' : 'indigo'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state whenever user or modal open state changes
  const [prevUser, setPrevUser] = useState(user);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (user !== prevUser || isOpen !== prevIsOpen) {
    setPrevUser(user);
    setPrevIsOpen(isOpen);
    if (user && isOpen) {
      setName(user.name || '');
      setPassword('');
      setAvatar(user.avatar || 'initials');
      setThemeColor(user.themeColor || (user.role === 'teacher' ? 'emerald' : 'indigo'));
    }
  }

  if (!isOpen || !user) return null;

  // Avatar presets
  const avatarOptions = ['initials', '👨‍🎓', '👩‍🎓', '🤖', '🦊', '🐼', '🦁', '🦉', '🦄'];

  // Theme presets
  const themeOptions = [
    { id: 'indigo', name: 'Indigo', color: '#4f46e5' },
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
    { id: 'crimson', name: 'Crimson', color: '#e11d48' },
    { id: 'amber', name: 'Amber', color: '#f59e0b' },
    { id: 'teal', name: 'Teal', color: '#0d9488' },
    { id: 'purple', name: 'Purple', color: '#7c3aed' }
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(name.trim(), password || null, avatar, themeColor);
      showSuccess('Profile updated successfully!');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';
  const activeColor = THEME_COLORS[themeColor] || THEME_COLORS.indigo;

  return createPortal(
    <>
      {/* Blurred Backdrop */}
      <div className="settings-backdrop" onClick={onClose} />

      {/* Settings Dialog */}
      <div className="settings-overlay">
        <style>{`
          .settings-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(8, 10, 16, 0.55);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            animation: settingsFadeIn 0.28s ease;
          }

          .settings-overlay {
            position: fixed;
            inset: 0;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            pointer-events: none;
            font-family: 'Outfit', 'Inter', sans-serif;
          }

          .settings-card {
            pointer-events: all;
            background: rgba(15, 23, 42, 0.93);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 28px;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05);
            padding: 1.5rem 1.75rem;
            max-width: 450px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            animation: settingsSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: left;
            position: relative;
          }

          @keyframes settingsFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes settingsSlideUp {
            from { opacity: 0; transform: translateY(22px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .settings-close-btn {
            position: absolute;
            top: 18px;
            right: 18px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            padding: 0;
          }

          .settings-close-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
            transform: rotate(90deg);
          }

          .settings-title {
            font-weight: 800;
            font-size: 24px;
            color: #ffffff;
            margin: 0;
            letter-spacing: -0.02em;
          }

          .settings-subtitle {
            font-size: 14px;
            color: #94a3b8;
            margin: 2px 0 0 0;
          }

          .avatar-preview-badge {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 35px;
            border: 3.5px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 8px 24px var(--theme-glow);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
          }

          .settings-section-title {
            font-weight: 700;
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .avatar-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
          }

          .avatar-select-btn {
            aspect-ratio: 1;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            color: rgba(255, 255, 255, 0.6);
            font-weight: 700;
            padding: 0;
          }

          .avatar-select-btn.initials-btn {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }

          .avatar-select-btn:hover {
            background-color: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.18);
            transform: scale(1.06) translateY(-1px);
          }

          .avatar-select-btn.active {
            border-color: var(--theme-color);
            background-color: rgba(255, 255, 255, 0.06);
            box-shadow: 0 4px 12px var(--theme-glow);
            transform: scale(1.06) translateY(-1px);
            color: #ffffff;
          }

          .settings-avatar-section {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .avatar-options-container {
            flex-grow: 1;
            min-width: 0;
          }

          @media (max-width: 480px) {
            .settings-card {
              padding: 1.25rem 1.25rem;
              border-radius: 20px;
              gap: 16px;
              max-height: 90vh;
              overflow-y: auto;
            }
            .settings-avatar-section {
              flex-direction: column;
              text-align: center;
              gap: 16px;
            }
            .avatar-options-container {
              width: 100%;
            }
          }

          .color-palette {
            display: flex;
            justify-content: space-between;
          }

          .color-option {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .color-option:hover {
            transform: scale(1.15) translateY(-1px);
          }

          .color-option.active {
            transform: scale(1.15) translateY(-1px);
            border-color: #ffffff;
            box-shadow: 0 0 10px var(--theme-color);
          }

          .input-icon-wrapper {
            position: relative;
            width: 100%;
          }

          .input-left-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
            transition: color 0.25s ease;
            pointer-events: none;
          }

          .input-icon-wrapper .form-control {
            padding-left: 42px;
            padding-right: 44px;
            height: 50px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
            font-size: 14px;
            color: #ffffff;
            transition: all 0.3s ease;
          }

          .input-icon-wrapper .form-control:focus {
            border-color: var(--theme-color);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 0 3px var(--theme-glow);
            outline: none;
          }

          .input-icon-wrapper .form-control:focus + .input-left-icon {
            color: var(--theme-color);
          }

          .password-toggle-btn {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .password-toggle-btn:hover {
            color: #ffffff;
          }

          .settings-btn-save {
            height: 46px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            background: var(--theme-gradient);
            border: none;
            color: white;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px var(--theme-glow);
            width: 100%;
          }

          .settings-btn-save:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px var(--theme-glow);
          }

          .settings-btn-save:disabled {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.25);
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
          }

          .settings-btn-cancel {
            height: 46px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
            width: 100%;
          }

          .settings-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>

        <form
          onSubmit={handleSave}
          className="settings-card"
          style={{
            '--theme-color': activeColor.primary,
            '--theme-gradient': activeColor.gradient,
            '--theme-glow': activeColor.glow
          }}
        >
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div>
            <h4 className="settings-title">Account Settings</h4>
            <p className="settings-subtitle">Customize your profile preferences</p>
          </div>

          {/* Avatar Section (Preview + Options) */}
          <div className="settings-avatar-section">
            <div className="avatar-preview-badge" style={{ background: 'var(--theme-gradient)', flexShrink: 0 }}>
              {avatar === 'initials' ? firstLetter : avatar}
            </div>
            <div className="avatar-options-container">
              <div className="settings-section-title">Select Avatar Symbol</div>
              <div className="avatar-grid">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`avatar-select-btn ${opt === 'initials' ? 'initials-btn' : ''} ${avatar === opt ? 'active' : ''}`}
                    onClick={() => setAvatar(opt)}
                  >
                    {opt === 'initials' ? firstLetter : opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Color Options */}
          <div>
            <div className="settings-section-title">Select Theme Color</div>
            <div className="color-palette">
              {themeOptions.map((t) => (
                <div
                  key={t.id}
                  className={`color-option ${themeColor === t.id ? 'active' : ''}`}
                  style={{ backgroundColor: t.color }}
                  onClick={() => setThemeColor(t.id)}
                  title={t.name}
                >
                  {themeColor === t.id && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <div className="settings-section-title">Full Name</div>
            <div className="input-icon-wrapper">
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
              <svg className="input-left-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="settings-section-title">Change Password</div>
            <div className="input-icon-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
              <svg className="input-left-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-3 mt-2">
            <button
              type="button"
              className="settings-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="settings-btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
};

export default SettingsModal;
