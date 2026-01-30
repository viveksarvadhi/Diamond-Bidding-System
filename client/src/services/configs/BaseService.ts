import axios from 'axios';
import appConfig from './app.config';

const apiClient = axios.create({
  baseURL: appConfig.apiPrefix,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(appConfig.auth.tokenKey);
    if (token) {
      config.headers.Authorization = `${appConfig.auth.tokenType}${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem(appConfig.auth.tokenKey);
      window.location.href = appConfig.unAuthenticatedEntryPath;
    }
    return Promise.reject(error);
  }
);

export default apiClient;