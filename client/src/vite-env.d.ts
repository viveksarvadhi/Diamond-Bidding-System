// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_PUBLIC_DOMAIN?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_IMG_PREFIX?: string;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}