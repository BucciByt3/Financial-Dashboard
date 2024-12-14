// src/App.jsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import FinanceDashboard from './components/FinanceDashboard';
import LoginForm from './components/LoginForm';
import AdminLogin from './components/AdminPanel/AdminLogin';
import AdminDashboard from './components/AdminPanel/AdminDashboard';

function App() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminData, setAdminData] = React.useState(null);

  // Check if we're on admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  const handleAdminLogin = (adminData) => {
    setIsAdmin(true);
    setAdminData(adminData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Handle admin routes
  if (isAdminRoute) {
    return isAdmin ? <AdminDashboard admin={adminData} /> : <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Handle regular user routes
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user ? <FinanceDashboard /> : <LoginForm />}
    </div>
  );
}

export default App;
