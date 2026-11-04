import React, { useState, useEffect } from 'react';
import './AuthPage.css';
import {
  initiateRegistration,
  verifyAndCompleteRegistration,
  loginUser,
  resendVerificationCode,
  formatDisplayPhone
} from '../services/auth';

export default function AuthPage({ onLoginSuccess }) {
  // Modes: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [adminRequested, setAdminRequested] = useState(false);

  // Verification state
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [incomingNotification, setIncomingNotification] = useState(null);

  // Soft notification chime
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio optional
    }
  };

  const triggerNotification = (code) => {
    setIncomingNotification({
      code,
    });
    playNotificationSound();
  };

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Switch mode helper
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setIncomingNotification(null);
  };

  // Re-open incoming popup notification if closed
  const handleShowPopupAgain = () => {
    if (!verificationCode || !pendingUser) return;
    triggerNotification(verificationCode);
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({
        identifier: loginIdentifier,
        password: loginPassword,
      });

      if (res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration and display the generated code in the in-app popup.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await initiateRegistration({
        username: regUsername,
        telephone: regTelephone,
        password: regPassword,
        adminRequested
      });

      if (res.success) {
        setPendingUser(res.pendingUser);
        setVerificationCode(res.verificationCode);
        setMode('verify');
        setResendCountdown(30);

        triggerNotification(res.verificationCode);
        setSuccessMsg('Your verification code is ready in the popup. You can stay on this page.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Generate and display a replacement code in the in-app popup.
  const handleResend = async () => {
    if (!pendingUser || resendCountdown > 0) return;
    setError(null);
    try {
      const res = await resendVerificationCode({
        pendingUser
      });
      if (res.success) {
        setPendingUser(res.pendingUser);
        setVerificationCode(res.verificationCode);
        setResendCountdown(30);
        setEnteredCode('');

        triggerNotification(res.verificationCode);
        setSuccessMsg('A new verification code is ready in the popup.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  // Handle Verification submission -> verifies phone and auto-logs in
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyAndCompleteRegistration({
        pendingUser,
        enteredCode,
      });

      if (res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* In-app verification notification; no external messaging app is opened. */}
      {incomingNotification && (
        <div className="incoming-popup-overlay" role="presentation">
          <div
            className="incoming-popup-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-popup-title"
          >
            <div className="incoming-popup-header">
              <div className="incoming-popup-app">
                <i className="fa-solid fa-shield-halved"></i>
                <span>Verification</span>
                <span className="incoming-popup-time">• Just now</span>
              </div>
              <button
                type="button"
                className="incoming-popup-close"
                onClick={() => setIncomingNotification(null)}
                aria-label="Dismiss verification code popup"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="incoming-popup-body">
              <div className="incoming-popup-sender">
                <span id="incoming-popup-title">Santa Columbus Apartments MIS</span>
                <span className="incoming-popup-badge">On this page</span>
              </div>
              <p className="incoming-popup-text">
                Your verification code is <strong className="incoming-popup-otp">{incomingNotification.code}</strong>.
                Use it below to complete registration. You do not need to open WhatsApp or SMS.
              </p>
            </div>

            <div className="incoming-popup-footer">
              <button
                type="button"
                className="incoming-popup-btn btn-autofill"
                onClick={() => {
                  setEnteredCode(incomingNotification.code);
                  setIncomingNotification(null);
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Use this code</span>
              </button>
              <button
                type="button"
                className="incoming-popup-btn btn-dismiss"
                onClick={() => setIncomingNotification(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="login">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <i className="fa-solid fa-building"></i>
          </div>
          <span className="login-brand-title">Santa Columbus Apartments</span>
          <span className="login-brand-sub">Management Information System</span>
        </div>

        {/* Tab switcher (only when not in verify step) */}
        {mode !== 'verify' && (
          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- 1. LOGIN FORM --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <h1>Login</h1>

            <div className="input">
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                placeholder="Phone or Username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>

            <p>
              Don't have an account?{' '}
              <a onClick={() => handleSwitchMode('register')}>Sign Up</a>
            </p>
          </form>
        )}

        {/* --- 2. REGISTRATION FORM --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <h1>Sign Up</h1>

            {/* Username */}
            <div className="input">
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                placeholder="Full Username (e.g. Sarah Jenkins)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Telephone */}
            <div className="input">
              <i className="fa-solid fa-phone"></i>
              <input
                type="tel"
                placeholder="Telephone (e.g. 0788123456)"
                value={regTelephone}
                onChange={(e) => setRegTelephone(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="input">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="Create Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <label className="flex items-start gap-2.5 my-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={adminRequested}
                onChange={(e) => setAdminRequested(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-blue-600"
              />
              <span>
                Request administrator access
                <span className="block text-xs text-slate-500 mt-0.5">
                  New accounts are always registered as users. An administrator must promote your role in Firebase.
                </span>
              </span>
            </label>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                </span>
              ) : (
                'Create Account & Show Code'
              )}
            </button>

            <p>
              Already registered?{' '}
              <a onClick={() => handleSwitchMode('login')}>Login</a>
            </p>
          </form>
        )}

        {/* --- 3. VERIFY NUMBER STEP --- */}
        {mode === 'verify' && pendingUser && (
          <form onSubmit={handleVerifySubmit}>
            <h1>Verify Number</h1>

            <div className="verification-card">
              <div className="verification-channel-badge">
                <i className="fa-solid fa-shield-halved"></i>
                <span>In-app Verification</span>
              </div>

              <p className="verification-instruction">
                Verification code for:
              </p>
              <div className="verification-phone-display">
                <i className="fa-solid fa-phone"></i>
                <span>{formatDisplayPhone(pendingUser.telephone)}</span>
              </div>

              <div className="verification-popup-info-box">
                <div className="popup-info-icon">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div className="popup-info-content">
                  <span className="popup-info-title">Code shown in an on-page popup</span>
                  <span className="popup-info-desc">
                    Use the popup to fill in the code. No other app or page is needed.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="channel-action-btn btn-show-popup"
                onClick={handleShowPopupAgain}
              >
                <i className="fa-solid fa-bell"></i>
                <span>Show verification code</span>
              </button>
            </div>

            {/* Verification code input */}
            <div className="input">
              <i className="fa-solid fa-shield-halved"></i>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                required
                autoFocus
                style={{ letterSpacing: '4px', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading || !enteredCode}>
              {loading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Verifying...
                </span>
              ) : (
                'Verify & Login'
              )}
            </button>

            {/* Resend Options */}
            <div className="resend-container">
              {resendCountdown > 0 ? (
                <span className="resend-timer">
                  Resend code in <strong>{resendCountdown}s</strong>
                </span>
              ) : (
                <div className="resend-links">
                  <span>Didn't receive code? </span>
                  <button type="button" className="resend-code-btn" onClick={handleResend}>
                    Resend code
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => handleSwitchMode('register')}
            >
              ← Change Telephone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
