import api, { ApiResponse } from './api';

// Types
export interface Result {
  id: number;
  bidId: number;
  winnerUserId: number;
  winningAmount: number;
  declaredAt: string;
  declaredBy: number;
  bid?: {
    id: number;
    startTime: string;
    endTime: string;
    baseBidPrice: number;
    status: string;
    diamond?: {
      id: number;
      name: string;
      basePrice: number;
      description?: string;
      image_url?: string;
    };
    userBids?: Array<{
      id: number;
      amount: number;
      createdAt: string;
      user: {
        id: number;
        name: string;
      };
    }>;
  };
  winner?: {
    id: number;
    name: string;
    email?: string;
  };
  declarer?: {
    id: number;
    name: string;
    email?: string;
  };
  userBidInfo?: {
    amount: number;
    createdAt: string;
    isWinner: boolean;
    rank: number;
  };
}

export interface DeclareResultData {
  bidId: number;
}

export interface ResultListResponse extends ApiResponse<{
  results: Result[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
  };
}> {}

export interface ResultResponse extends ApiResponse<{ result: Result }> {}

export interface BidSummary {
  bid: {
    id: number;
    startTime: string;
    endTime: string;
    baseBidPrice: number;
    status: string;
    diamond: {
      id: number;
      name: string;
      basePrice: number;
    };
  };
  summary: {
    totalBids: number;
    totalAmount: number;
    averageAmount: number;
    highestBid?: {
      amount: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
    };
    lowestBid?: {
      amount: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
    };
  };
  canDeclareResult: boolean;
  allBids: Array<{
    id: number;
    amount: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface ResultStats {
  overview: {
    totalResults: number;
    totalBids: number;
    closedBids: number;
    declaredResults: number;
    pendingDeclarations: number;
  };
  monthlyResults: Array<{
    month: string;
    count: number;
    totalAmount: number;
  }>;
  topResults: Result[];
}

export interface ResultSummaryResponse extends ApiResponse<BidSummary> {}

export interface ResultStatsResponse extends ApiResponse<ResultStats> {}

class ResultService {
  // Get all results (Admin only)
  async getResults(params?: {
    page?: number;
    limit?: number;
    bidId?: number;
  }): Promise<ResultListResponse> {
    const response = await api.get('/results', { params });
    return response.data;
  }

  // Get current user's results
  async getMyResults(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ResultListResponse> {
    const response = await api.get('/results/my-results', { params });
    return response.data;
  }

  // Get result by ID (public)
  async getResultById(id: number): Promise<ResultResponse> {
    const response = await api.get(`/results/${id}`);
    return response.data;
  }

  // Declare result (Admin only)
  async declareResult(data: DeclareResultData): Promise<ResultResponse> {
    const response = await api.post('/results', data);
    return response.data;
  }

  // Get bid summary before declaring result (Admin only)
  async getBidSummary(bidId: number): Promise<ResultSummaryResponse> {
    const response = await api.get(`/results/bid/${bidId}/summary`);
    return response.data;
  }

  // Get result statistics (Admin only)
  async getResultStats(): Promise<ResultStatsResponse> {
    const response = await api.get('/results/stats/overview');
    return response.data;
  }

  // Delete result (Admin only, emergency use)
  async deleteResult(id: number): Promise<ApiResponse> {
    const response = await api.delete(`/results/${id}`);
    return response.data;
  }
}

export default new ResultService();
