import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import RegisterPage from '../pages/RegisterPage';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import DiamondManagement from '../pages/admin/DiamondManagement';
import BidManagement from '../pages/admin/BidManagement';
import ResultsManagement from '../pages/ResultsManagement';

// User Pages
import UserBiddingInterface from '../pages/user/BiddingInterface';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<Home />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="ADMIN">
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/diamonds" element={
        <ProtectedRoute requiredRole="ADMIN">
          <DiamondManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/bids" element={
        <ProtectedRoute requiredRole="ADMIN">
          <BidManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/results" element={
        <ProtectedRoute requiredRole="ADMIN">
          <ResultsManagement />
        </ProtectedRoute>
      } />
      
      {/* User Routes */}
      <Route path="/user" element={
        <ProtectedRoute requiredRole="USER">
          <UserBiddingInterface />
        </ProtectedRoute>
      } />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;