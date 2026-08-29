import axios from 'axios';

// Use relative /api URL so Next.js proxy rewrites handle tunneling seamlessly for mobile/external devices
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Relative /api allows any device (mobile on 192.168.x.x, localhost, tunnel) to hit Next.js proxy rewrite
    return '/api';
  }
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://backendapi.streamespn.org/api'
      : 'http://localhost:5000/api');

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
