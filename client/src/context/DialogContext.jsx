import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DialogContext } from '../hooks/useDialog';

/**
 * DialogProvider
 * Wraps the app and provides app-wide imperative modal dialogs.
 * Replaces browser alert() and window.confirm() with a beautiful
 * frosted-glass card overlay.
 *
 * Two ways to trigger dialogs:
 *  1. Inside React — use the useDialog() hook (hooks/useDialog.js).
 *  2. Outside React — fire a custom event (used by notify.js):
 *       window.dispatchEvent(new CustomEvent('app:dialog', {
 *         detail: { variant: 'success', message: 'Done!' }
 *       }));
 */

// ---------------------------------------------------------------------------
// Variant metadata
// ---------------------------------------------------------------------------
const VARIANTS = {
  success: {
    icon: '✓',
    color: '#10b981',
    bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    border: '#6ee7b7',
    label: 'Success',
  },
  error: {
    icon: '✕',
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    border: '#fca5a5',
    label: 'Error',
  },
  info: {
    icon: 'ℹ',
    color: '#3b82f6',
    bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    border: '#93c5fd',
    label: 'Info',
  },
  warn: {
    icon: '⚠',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    border: '#fcd34d',
    label: 'Warning',
  },
  confirm: {
    icon: '?',
    color: '#6366f1',
    bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    border: '#c4b5fd',
    label: 'Confirm',
  },
  greenConfirm: {
    icon: '?',
    color: '#10b981',
    bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    border: '#6ee7b7',
    label: 'Confirm',
  },
};

// ---------------------------------------------------------------------------
// Provider — the only export from this file (satisfies react-refresh rule)
// ---------------------------------------------------------------------------
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  /** Show an alert modal. Resolves when the user dismisses it. */
  const showAlert = useCallback((variant = 'info', message, detail) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ type: 'alert', variant, message, detail });
    });
  }, []);

  /** Show a confirm modal. Resolves to true (Confirm) or false (Cancel). */
  const showConfirm = useCallback((message, detail, variant = 'confirm') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ type: 'confirm', variant, message, detail });
    });
  }, []);

  const handleClose = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  // Listen for custom 'app:dialog' events dispatched by notify.js.
  // This decouples the notification service from React without needing a bridge.
  useEffect(() => {
    const handler = (e) => {
      const { variant = 'info', message, detail } = e.detail || {};
      showAlert(variant, message, detail);
    };
    window.addEventListener('app:dialog', handler);
    return () => window.removeEventListener('app:dialog', handler);
  }, [showAlert]);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && createPortal(
        <DialogModal dialog={dialog} onClose={handleClose} />,
        document.body
      )}
    </DialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Modal UI — internal, intentionally not exported
// ---------------------------------------------------------------------------
function DialogModal({ dialog, onClose }) {
  const { type, variant, message, detail } = dialog;
  const v = VARIANTS[variant] || VARIANTS.info;
  const isConfirm = type === 'confirm';

  return (
    <>
      {/* Blurred backdrop */}
      <div
        style={backdropStyle}
        onClick={isConfirm ? undefined : () => onClose(undefined)}
      />

      {/* Card */}
      <div style={overlayStyle}>
        <div
          style={cardStyle}
          role="dialog"
          aria-modal="true"
          aria-label={v.label}
        >
          {/* Icon circle */}
          <div style={{ ...iconCircleStyle, background: v.bg, borderColor: v.border }}>
            <span style={{ ...iconStyle, color: v.color }}>{v.icon}</span>
          </div>

          {/* Title */}
          <p style={titleStyle}>{v.label}</p>

          {/* Message */}
          <p style={messageStyle}>{message}</p>

          {/* Optional detail line */}
          {detail && <p style={detailStyle}>{detail}</p>}

          {/* Actions */}
          <div style={actionsStyle}>
            {isConfirm && (
              <button
                id="dialog-cancel-btn"
                style={{ ...btnStyle, ...cancelBtnStyle }}
                onClick={() => onClose(false)}
              >
                Cancel
              </button>
            )}
            <button
              id="dialog-ok-btn"
              style={{
                ...btnStyle,
                background: v.color,
                boxShadow: `0 4px 14px ${v.color}55`,
              }}
              onClick={() => onClose(isConfirm ? true : undefined)}
              autoFocus
            >
              {isConfirm ? 'Confirm' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const backdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 9000,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  background: 'rgba(15, 23, 42, 0.45)',
  animation: 'dialogFadeIn 0.2s ease',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 9001,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  pointerEvents: 'none',
};

const cardStyle = {
  pointerEvents: 'all',
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '24px',
  boxShadow: '0 32px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.6)',
  padding: '2.25rem 2rem 1.75rem',
  maxWidth: '400px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  animation: 'dialogSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
  textAlign: 'center',
};

const iconCircleStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0.5rem',
  flexShrink: 0,
};

const iconStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  lineHeight: 1,
};

const titleStyle = {
  margin: 0,
  fontWeight: 700,
  fontSize: '1.1rem',
  color: '#0f172a',
  letterSpacing: '-0.01em',
};

const messageStyle = {
  margin: 0,
  fontSize: '0.93rem',
  color: '#475569',
  lineHeight: 1.6,
  maxWidth: '320px',
};

const detailStyle = {
  margin: '0.15rem 0 0',
  fontSize: '0.82rem',
  color: '#94a3b8',
  fontStyle: 'italic',
};

const actionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1.25rem',
  width: '100%',
  justifyContent: 'center',
};

const btnStyle = {
  padding: '0.65rem 1.75rem',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#ffffff',
  transition: 'transform 0.15s ease, opacity 0.15s ease',
  letterSpacing: '0.01em',
};

const cancelBtnStyle = {
  background: 'rgba(100,116,139,0.12)',
  color: '#475569',
  boxShadow: 'none',
};
