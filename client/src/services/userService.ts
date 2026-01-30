import api, { ApiResponse } from './api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

export interface UpdateUserData {
  name?: string;
  role?: 'USER' | 'ADMIN';
}

export interface UserListResponse extends ApiResponse<{
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
  };
}> {}

export interface UserResponse extends ApiResponse<{ user: User }> {}

class UserService {
  // Get all users (Admin only)
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UserListResponse> {
    const response = await api.get('/users', { params });
    return response.data;
  }

  // Get user by ID (Admin only)
  async getUserById(id: number): Promise<UserResponse> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  // Create new user (Admin only)
  async createUser(data: CreateUserData): Promise<UserResponse> {
    const response = await api.post('/users', data);
    return response.data;
  }

  // Update user (Admin only)
  async updateUser(id: number, data: UpdateUserData): Promise<UserResponse> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  // Activate/Deactivate user (Admin only)
  async toggleUserStatus(id: number): Promise<UserResponse> {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  }

  // Delete user (Admin only)
  async deleteUser(id: number): Promise<ApiResponse> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
}

export default new UserService();
