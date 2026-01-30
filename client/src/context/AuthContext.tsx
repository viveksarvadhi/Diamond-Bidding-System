import { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout } from '../store/slices/authSlice';
import { authService } from '../services';
import type { User, LoginCredentials, RegisterData } from '../services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isUserActive: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const token = authService.getStoredToken();
        if (token) {
          const response = await authService.validateToken();
          if (response.success && response.data) {
            dispatch(loginSuccess(response.data.user));
          } else {
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, [dispatch]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        const { user, token } = response.data;
        authService.setAuthData(user, token);
        dispatch(loginSuccess(user));
        return user;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<User> => {
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        const { user, token } = response.data;
        authService.setAuthData(user, token);
        dispatch(loginSuccess(user));
        return user;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logoutUser = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuthData();
      dispatch(logout());
    }
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const isUserActive = (): boolean => {
    return authService.isUserActive();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout: logoutUser,
        isAdmin,
        isUserActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
