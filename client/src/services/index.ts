// src/services/index.ts
// This file exports all services for easy imports elsewhere

// Import all services
import api from './api';
import authService from './authService';
import userService from './userService';
import diamondService from './diamondService';
import bidService from './bidService';
import userBidService from './userBidService';
import resultService from './resultService';

// Export services
export {
  api,
  authService,
  userService,
  diamondService,
  bidService,
  userBidService,
  resultService,
};

// Export types
export type {
  ApiResponse,
  ApiError,
} from './api';

export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from './authService';

export type {
  Diamond,
  CreateDiamondData,
  UpdateDiamondData,
} from './diamondService';

export type {
  Bid,
  CreateBidData,
  UpdateBidData,
  UserBid,
  Result,
  BidStats,
} from './bidService';

export type {
  PlaceBidData,
  EditBidData,
  BidHistory,
  HighestBidInfo,
} from './userBidService';

export type {
  DeclareResultData,
  ResultStats,
  BidSummary,
} from './resultService';
