// src/services/configs/ApiService.ts
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from './BaseService.ts';

type FetchDataParam = AxiosRequestConfig;

const ApiService = {
  fetchData<T>(param: FetchDataParam): Promise<AxiosResponse<T>> {
    // Add cache control headers
    param.headers = {
      ...param.headers,
      'Cache-Control': 'no-store',
    };

    // Add a unique timestamp to prevent caching
    param.params = {
      ...param.params,
      _t: new Date().getTime(),
    };

    // Handle FormData separately (no encryption)
    if (param.data instanceof FormData) {
      return apiClient<T>(param);
    }

    return apiClient<T>(param);
  },

  // Helper methods for common HTTP methods
  get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.fetchData<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  },

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.fetchData<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  },

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.fetchData<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.fetchData<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  },

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.fetchData<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  },
};

export default ApiService;