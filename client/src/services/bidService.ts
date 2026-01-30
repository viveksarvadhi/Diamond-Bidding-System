import api, { ApiResponse } from './api';

// Types
export interface Bid {
  id: number;
  diamondId: number;
  baseBidPrice: number;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  resultDeclared: boolean;
  createdAt: string;
  updatedAt: string;
  diamond?: {
    id: number;
    name: string;
    basePrice: number;
    description?: string;
    image_url?: string;
  };
  userBids?: UserBid[];
  result?: Result;
}

export interface CreateBidData {
  diamondId: number;
  baseBidPrice: number;
  startTime: string;
  endTime: string;
}

export interface UpdateBidData {
  baseBidPrice?: number;
  startTime?: string;
  endTime?: string;
}

export interface UserBid {
  id: number;
  userId: number;
  bidId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface Result {
  id: number;
  bidId: number;
  winnerUserId: number;
  winningAmount: number;
  declaredAt: string;
  declaredBy: number;
  winner?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface BidStats {
  totalBids: number;
  totalAmount: number;
  averageAmount: number;
  highestAmount: number;
  lowestAmount: number;
}

export interface BidListResponse extends ApiResponse<{
  bids: Bid[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBids: number;
    limit: number;
  };
}> {}

export interface BidResponse extends ApiResponse<{ bid: Bid }> {}

export interface BidStatsResponse extends ApiResponse<{
  bid: Bid;
  userBidStats: BidStats;
  topBids: UserBid[];
}> {}

class BidService {
  // Get all bids (Admin only)
  async getBids(params?: {
    page?: number;
    limit?: number;
    status?: string;
    diamondId?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<BidListResponse> {
    const response = await api.get('/bids', { params });
    return response.data;
  }

  // Get active bids (public)
  async getActiveBids(params?: {
    page?: number;
    limit?: number;
    diamondId?: number;
  }): Promise<BidListResponse> {
    const response = await api.get('/bids/active', { params });
    return response.data;
  }

  // Get bid by ID (Admin only)
  async getBidById(id: number): Promise<BidResponse> {
    const response = await api.get(`/bids/${id}`);
    return response.data;
  }

  // Create new bid (Admin only)
  async createBid(data: CreateBidData): Promise<BidResponse> {
    const response = await api.post('/bids', data);
    return response.data;
  }

  // Update bid (Admin only, DRAFT only)
  async updateBid(id: number, data: UpdateBidData): Promise<BidResponse> {
    const response = await api.put(`/bids/${id}`, data);
    return response.data;
  }

  // Activate bid (Admin only)
  async activateBid(id: number): Promise<BidResponse> {
    const response = await api.patch(`/bids/${id}/activate`);
    return response.data;
  }

  // Delete bid (Admin only, DRAFT only)
  async deleteBid(id: number): Promise<ApiResponse> {
    const response = await api.delete(`/bids/${id}`);
    return response.data;
  }

  // Get bid statistics (Admin only)
  async getBidStats(id: number): Promise<BidStatsResponse> {
    const response = await api.get(`/bids/${id}/stats`);
    return response.data;
  }
}

export default new BidService();
