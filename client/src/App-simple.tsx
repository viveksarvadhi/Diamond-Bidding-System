import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimpleHome from './pages/SimpleHome';
import SimpleLogin from './pages/SimpleLogin';
import RegisterPage from './pages/RegisterPage';
import TestBidPage from './pages/TestBidPage';
import SimpleAdminDashboard from './pages/SimpleAdminDashboard';
import SimpleUserDashboard from './pages/SimpleUserDashboard';
import CreateAuction from './pages/CreateAuction';
import BiddingPage from './pages/BiddingPage';

function SimpleApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'ADMIN' ? 
              <Navigate to="/admin" replace /> : 
              <Navigate to="/user" replace />
            ) : 
            <SimpleHome />
          } 
        />
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/test" element={<TestBidPage />} />
        <Route 
          path="/admin" 
          element={
            user && user.role === 'ADMIN' ? 
            <SimpleAdminDashboard /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/create-auction" 
          element={
            user && user.role === 'ADMIN' ? 
            <CreateAuction /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/user" 
          element={
            user && user.role === 'USER' ? 
            <BiddingPage /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default SimpleApp;
