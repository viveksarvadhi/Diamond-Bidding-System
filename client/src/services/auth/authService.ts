// src/services/auth/authService.ts
import apiClient from '../configs/BaseService';
import { ENDPOINTS } from '../index';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async register(userData: RegisterData): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
  }

  async validateToken(): Promise<ApiResponse<any>> {
    return apiClient.get(ENDPOINTS.AUTH.VALIDATE_TOKEN);
  }

  async refreshToken(): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

export default new AuthService();
