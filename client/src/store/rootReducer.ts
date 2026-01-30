// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
// Import other reducers as needed

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  // Add more reducers here
});

export default rootReducer;
