// src/services/configs/app.config.ts
interface AppConfig {
  publicDomain: string;
  backendUrl: string;
  apiPrefix: string;
  imgUrlPrefix: string;
  authenticatedEntryPath: string;
  unAuthenticatedEntryPath: string;
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    tokenType: string;
  };
  endpoints: {
    auth: {
      login: string;
      register: string;
      validateToken: string;
      refreshToken: string;
    };
    users: {
      getProfile: string;
      updateProfile: string;
    };
    products: {
      list: string;
      details: (id: string) => string;
    };
  };
}

const appConfig: AppConfig = {
  publicDomain: import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin,
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  apiPrefix: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1`,
  imgUrlPrefix: import.meta.env.VITE_IMG_PREFIX || '',
  authenticatedEntryPath: '/dashboard',
  unAuthenticatedEntryPath: '/login',
  auth: {
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
    tokenType: 'Bearer ',
  },
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      validateToken: '/auth/validate-token',
      refreshToken: '/auth/refresh-token',
    },
    users: {
      getProfile: '/users/profile',
      updateProfile: '/users/profile',
    },
    products: {
      list: '/products',
      details: (id) => `/products/${id}`,
    },
  },
};

export default appConfig;