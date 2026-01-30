import api, { ApiResponse } from './api';

// Types
export interface UserBid {
  id: number;
  userId: number;
  bidId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  bid?: {
    id: number;
    status: string;
    startTime: string;
    endTime: string;
    baseBidPrice: number;
    diamond?: {
      id: number;
      name: string;
      basePrice: number;
      image_url?: string;
    };
  };
}

export interface BidHistory {
  id: number;
  userBidId: number;
  oldAmount?: number;
  newAmount: number;
  updatedAt: string;
}

export interface PlaceBidData {
  bidId: number;
  amount: number;
}

export interface EditBidData {
  amount: number;
}

export interface HighestBidInfo {
  bid: {
    id: number;
    status: string;
    endTime: string;
  };
  diamond: {
    id: number;
    name: string;
    basePrice: number;
  };
  highestBid?: {
    amount: number;
    user: {
      id: number;
      name: string;
    };
  };
  totalBids: number;
  isBiddingOpen: boolean;
}

export interface UserBidListResponse extends ApiResponse<{
  userBids: UserBid[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBids: number;
    limit: number;
  };
}> {}

export interface UserBidResponse extends ApiResponse<{ userBid: UserBid }> {}

export interface BidHistoryResponse extends ApiResponse<{
  userBid: UserBid;
  bidHistory: BidHistory[];
}> {}

export interface HighestBidResponse extends ApiResponse<HighestBidInfo> {}

export interface AllBidsResponse extends ApiResponse<{
  bid: {
    id: number;
    diamond: {
      id: number;
      name: string;
      basePrice: number;
    };
  };
  userBids: UserBid[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBids: number;
    limit: number;
  };
}> {}

class UserBidService {
  // Get current user's bids
  async getMyBids(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<UserBidListResponse> {
    const response = await api.get('/user-bids/my-bids', { params });
    return response.data;
  }

  // Get bid history for specific user bid
  async getBidHistory(userBidId: number): Promise<BidHistoryResponse> {
    const response = await api.get(`/user-bids/${userBidId}/history`);
    return response.data;
  }

  // Place new bid
  async placeBid(data: PlaceBidData): Promise<UserBidResponse> {
    const response = await api.post('/user-bids', data);
    return response.data;
  }

  // Edit existing bid
  async editBid(userBidId: number, data: EditBidData): Promise<UserBidResponse> {
    const response = await api.put(`/user-bids/${userBidId}`, data);
    return response.data;
  }

  // Delete user bid
  async deleteBid(userBidId: number): Promise<ApiResponse> {
    const response = await api.delete(`/user-bids/${userBidId}`);
    return response.data;
  }

  // Get highest bid for specific bid (public)
  async getHighestBid(bidId: number): Promise<HighestBidResponse> {
    const response = await api.get(`/user-bids/bid/${bidId}/highest`);
    return response.data;
  }

  // Get all bids for specific bid (Admin only)
  async getAllBids(bidId: number, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AllBidsResponse> {
    const response = await api.get(`/user-bids/bid/${bidId}/all`, { params });
    return response.data;
  }
}

export default new UserBidService();
