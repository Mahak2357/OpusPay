import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let refreshRequest = null;
const sessionEndpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (!request || error.response?.status !== 401 || request._retry || request.skipAuthRefresh || sessionEndpoints.includes(request.url)) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshRequest ||= api.post('/auth/refresh', {}, { skipAuthRefresh: true }).finally(() => { refreshRequest = null; });
      await refreshRequest;
      return api(request);
    } catch (refreshError) {
      window.dispatchEvent(new Event('opuspay:session-expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
