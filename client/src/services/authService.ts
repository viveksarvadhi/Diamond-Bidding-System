import api, { ApiResponse } from './api';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginResponse extends ApiResponse<AuthResponse> {}

export interface RegisterResponse extends ApiResponse<AuthResponse> {}

export interface ProfileResponse extends ApiResponse<{ user: User }> {}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  // Register new user
  async register(userData: RegisterData): Promise<RegisterResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  // Get current user profile
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  // Logout user
  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  // Validate token
  async validateToken(): Promise<ProfileResponse> {
    const response = await api.get('/auth/validate');
    return response.data;
  }

  // Store auth data in localStorage
  setAuthData(user: User, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }

  // Get stored user
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get stored token
  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'ADMIN';
  }

  // Check if user is active
  isUserActive(): boolean {
    const user = this.getStoredUser();
    return user?.isActive === true;
  }
}

export default new AuthService();
