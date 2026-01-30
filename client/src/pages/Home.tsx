import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const Home = () => {
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);

  // Redirect based on authentication and role
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'USER') {
    return <Navigate to="/user" replace />;
  }

  // Fallback
  return <Navigate to="/login" replace />;
};

export default Home;
