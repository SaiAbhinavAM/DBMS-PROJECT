import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GrowerRegisterPage from './pages/GrowerRegisterPage';
import GrowerDashboard from './pages/GrowerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/grower-register" element={<GrowerRegisterPage />} />
          
          <Route
            path="/grower-dashboard"
            element={
              <ProtectedRoute userType="grower">
                <GrowerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute userType="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute userType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;