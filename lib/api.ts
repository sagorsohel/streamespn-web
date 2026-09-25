import axios from 'axios';

// Base URL resolver: direct backend connection for production, relative /api for localhost proxy
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If running in browser on production domain or hostname includes streamespn:
    if (window.location.hostname.includes('streamespn.org')) {
      return 'https://backendapi.streamespn.org/api';
    }
    // If NEXT_PUBLIC_API_URL is configured and not localhost:
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    // Local dev: relative /api allows Next.js proxy rewrite for localhost & tunnel devices
    return '/api';
  }

  // Server-side (SSR) in Node
  const rawUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'http://127.0.0.1:5001/api'
      : 'http://localhost:5001/api');

  return rawUrl.replace(/\/$/, '');
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
});

// Automatic Resilient Retry Interceptor for GET Requests (up to 3 retries)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.method?.toLowerCase() !== 'get') {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount < 3) {
      config.__retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
