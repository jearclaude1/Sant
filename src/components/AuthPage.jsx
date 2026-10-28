import React, { useState } from 'react';
import './AuthPage.css';
import {
  initiateRegistration,
  verifyAndCompleteRegistration,
  loginUser
} from '../services/auth';

export default function AuthPage({ onLoginSuccess }) {
  // Modes: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Verification state
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  // UI state
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Switch mode helper
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
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

  // Handle Registration submission -> triggers Verification step
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await initiateRegistration({
        username: regUsername,
        telephone: regTelephone,
        password: regPassword,
      });

      if (res.success) {
        setPendingUser(res.pendingUser);
        setVerificationCode(res.verificationCode);
        setMode('verify');
        setSuccessMsg(`Verification code generated for ${res.pendingUser.telephone}`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
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

  // Quick fill verification code for testing convenience
  const handleAutoFillCode = () => {
    if (verificationCode) {
      setEnteredCode(verificationCode);
    }
  };

  return (
    <div className="auth-page-wrapper">
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
              Don't have an account? <b>or</b>{' '}
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

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>

            <p>
              Already registered? <b>or</b>{' '}
              <a onClick={() => handleSwitchMode('login')}>Login</a>
            </p>
          </form>
        )}

        {/* --- 3. VERIFY NUMBER STEP --- */}
        {mode === 'verify' && pendingUser && (
          <form onSubmit={handleVerifySubmit}>
            <h1>Verify Number</h1>

            <div className="verification-card">
              <p style={{ margin: '0 0 6px 0', fontSize: '11.5px', color: '#666' }}>
                A 6-digit verification code was sent to:
              </p>
              <strong style={{ color: '#333', fontSize: '14px' }}>
                <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#4bb3d0' }}></i>
                {pendingUser.telephone}
              </strong>

              <div style={{ marginTop: '10px' }}>
                <div className="verification-otp-display" title="Click to autofill" onClick={handleAutoFillCode} style={{ cursor: 'pointer' }}>
                  {verificationCode}
                </div>
                <div style={{ fontSize: '10.5px', color: '#888' }}>
                  (Click code above to autofill)
                </div>
              </div>
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
