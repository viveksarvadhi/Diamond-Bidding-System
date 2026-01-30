import api, { ApiResponse } from './api';

// Types
export interface Diamond {
  id: number;
  name: string;
  basePrice: number;
  description?: string;
  image_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiamondData {
  name: string;
  basePrice: number;
  description?: string;
  image_url?: string;
}

export interface UpdateDiamondData {
  name?: string;
  basePrice?: number;
  description?: string;
  image_url?: string;
}

export interface DiamondListResponse extends ApiResponse<{
  diamonds: Diamond[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDiamonds: number;
    limit: number;
  };
}> {}

export interface DiamondResponse extends ApiResponse<{ diamond: Diamond }> {}

export interface DiamondStatsResponse extends ApiResponse<{
  diamond: Diamond;
  bidStatusStats: Array<{
    status: string;
    count: number;
  }>;
  userBidStats: {
    totalBids: number;
    totalAmount: number;
    averageAmount: number;
    highestAmount: number;
  };
}> {}

class DiamondService {
  // Get all diamonds (public)
  async getDiamonds(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<DiamondListResponse> {
    const response = await api.get('/diamonds', { params });
    return response.data;
  }

  // Get diamond by ID (public)
  async getDiamondById(id: number): Promise<DiamondResponse> {
    const response = await api.get(`/diamonds/${id}`);
    return response.data;
  }

  // Create new diamond (Admin only)
  async createDiamond(data: CreateDiamondData): Promise<DiamondResponse> {
    const response = await api.post('/diamonds', data);
    return response.data;
  }

  // Update diamond (Admin only)
  async updateDiamond(id: number, data: UpdateDiamondData): Promise<DiamondResponse> {
    const response = await api.put(`/diamonds/${id}`, data);
    return response.data;
  }

  // Delete diamond (Admin only)
  async deleteDiamond(id: number): Promise<ApiResponse> {
    const response = await api.delete(`/diamonds/${id}`);
    return response.data;
  }

  // Get diamond statistics (Admin only)
  async getDiamondStats(id: number): Promise<DiamondStatsResponse> {
    const response = await api.get(`/diamonds/${id}/stats`);
    return response.data;
  }
}

export default new DiamondService();
