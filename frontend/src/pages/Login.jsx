import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const { login, isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!loading && isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/dashboard' : '/rider'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (!ok) {
      setFormError('Invalid email or password.');
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <i className="ti ti-basket" aria-hidden="true" />
          EZER Supermarket
        </div>
        <p className="login-subtitle">Staff login — admin &amp; rider accounts only.</p>

        {formError && <div className="login-error">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="login-back">← Back to shop</Link>
      </div>
    </div>
  );
}
