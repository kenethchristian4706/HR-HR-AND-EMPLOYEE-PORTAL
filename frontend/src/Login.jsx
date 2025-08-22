import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        email,
        password,
      });
      if (response.data.role === 'hr') {
        try { localStorage.setItem('hrUser', JSON.stringify(response.data.data)); } catch (e) {}
        navigate('/hr-dashboard');
      } else if (response.data.role === 'employee') {
        try { localStorage.setItem('employeeUser', JSON.stringify(response.data.data)); } catch (e) {}
        navigate('/employee-dashboard');
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="project-title">HR+ : HR AND EMPLOYEE PORTAL!!</div>
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <label className="login-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
            autoComplete="username"
          />
          <label className="login-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading && <span className="login-spinner" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
