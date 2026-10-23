import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('504')) {
        setError('Cannot connect to backend server. Please verify that the backend is running on port 8000 (uvicorn app.main:app --port 8000).');
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🍽️</div>
          <h1 className="login-title">Restaurant Management</h1>
          <p className="login-subtitle">Sign in to access your role dashboard</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="name@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-login-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-fill-section">
          <div className="quick-fill-title">Quick Demo Login</div>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('admin@restaurant.com', 'Admin@123')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('cashier1@restaurant.com', 'Cashier@123')}
            >
              🧾 Cashier
            </button>
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('investor1@restaurant.com', 'Investor@123')}
            >
              💼 Investor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
