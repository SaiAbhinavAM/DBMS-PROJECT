import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState('grower');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Grower login state
  const [growerEmail, setGrowerEmail] = useState('');
  const [growerPassword, setGrowerPassword] = useState('');

  // Customer login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleGrowerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.growerLogin(growerEmail, growerPassword);
      const { token, user } = response.data;
      login(user, token);
      navigate('/grower-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.customerLogin(email, password);
      const { token, user } = response.data;
      login(user, token);
      navigate('/customer-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.adminLogin(adminUsername, adminPassword);
      const { token, user } = response.data;
      login(user, token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Urban Farming System</h1>
        <p className="subtitle">Login to your account</p>

        <div className="user-type-selector">
          <button
            className={`type-btn ${userType === 'grower' ? 'active' : ''}`}
            onClick={() => { setUserType('grower'); setError(''); }}
          >
            🌱 Grower
          </button>
          <button
            className={`type-btn ${userType === 'customer' ? 'active' : ''}`}
            onClick={() => { setUserType('customer'); setError(''); }}
          >
            🛒 Customer
          </button>
          <button
            className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
            onClick={() => { setUserType('admin'); setError(''); }}
          >
            👨‍💼 Admin
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {userType === 'grower' ? (
          <form onSubmit={handleGrowerLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={growerEmail}
                onChange={(e) => setGrowerEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={growerPassword}
                onChange={(e) => setGrowerPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Logging in...' : 'Login as Grower'}
            </button>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', color: '#666' }}>
              Demo: email: <strong>john@farmmail.com</strong> | password: <strong>john123</strong>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCustomerLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Logging in...' : 'Login as Customer'}
            </button>
          </form>
        )}

        {userType === 'admin' && (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', color: '#666' }}>
              Demo: username: <strong>admin</strong> | password: <strong>admin123</strong>
            </p>
          </form>
        )}

        {userType === 'grower' && (
          <div className="register-link">
            New grower? <button onClick={() => navigate('/grower-register')}>Register here</button>
          </div>
        )}

        {userType === 'customer' && (
          <div className="register-link">
            Don't have an account? <button onClick={() => navigate('/register')}>Register here</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;