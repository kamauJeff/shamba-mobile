import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth.store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://shamba-api-4ula.onrender.com/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          // API shape: { success, data: { tokens: { accessToken, refreshToken } } }
          const payload = res.data?.data ?? res.data;
          const newToken = payload?.tokens?.accessToken || payload?.accessToken || payload?.token;
          if (!newToken) throw new Error('No token in refresh response');
          useAuthStore.getState().setToken(newToken);
          const newRefresh = payload?.tokens?.refreshToken || payload?.refreshToken;
          if (newRefresh) useAuthStore.getState().setRefreshToken(newRefresh);
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (phone: string, password: string) => apiClient.post('/auth/login', { phone, password }),
  register: (data: { name: string; phone: string; password: string; role: string; county?: string }) =>
    apiClient.post('/auth/register', data),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),
};

export const farmerApi = {
  getDashboard: () => apiClient.get('/farmer/dashboard'),
  getProfile: () => apiClient.get('/farmer/profile'),
  upsertProfile: (data: object) => apiClient.put('/farmer/profile', data),
  getCreditScore: () => apiClient.get('/farmer/credit'),
  refreshCredit: () => apiClient.post('/farmer/credit/refresh'),
  getCreditHistory: () => apiClient.get('/farmer/credit/history'),
  getYieldHistory: () => apiClient.get('/farmer/yield-history'),
};

export const loansApi = {
  getMyLoans: () => apiClient.get('/loans'),
  getLoan: (id: string) => apiClient.get(`/loans/${id}`),
  apply: (data: { principalKes: number; termMonths: number; purpose: string; purposeDetails?: string }) =>
    apiClient.post('/loans/apply', data),
  repay: (loanId: string, data: { mpesaRef: string; amountKes: number }) =>
    apiClient.post(`/loans/${loanId}/repay`, data),
};

export const marketApi = {
  getListings: (params?: { search?: string; county?: string; crop?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/market/listings', { params }),
  getMyListings: () => apiClient.get('/market/listings/mine'),
  getListing: (id: string) => apiClient.get(`/market/listings/${id}`),
  createListing: (data: object) => apiClient.post('/market/listings', data),
  updateListing: (id: string, data: object) => apiClient.patch(`/market/listings/${id}`, data),
  deleteListing: (id: string) => apiClient.delete(`/market/listings/${id}`),
  placeOrder: (data: { listingId: string; quantityKg: number; deliveryAddress?: string; notes?: string }) =>
    apiClient.post('/market/orders', data),
  getOrders: () => apiClient.get('/market/orders'),
  confirmDelivery: (orderId: string) => apiClient.post(`/market/orders/${orderId}/confirm-delivery`),
  getPrices: (params?: { crop?: string; county?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/market/prices', { params }),
};

export const walletApi = {
  getWallet: () => apiClient.get('/wallet'),
  getTransactions: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/wallet/transactions', { params }),
  withdraw: (amountKes: number) => apiClient.post('/wallet/withdraw', { amountKes }),
  topup: (amountKes: number) => apiClient.post('/wallet/topup', { amountKes }),
};

export const groupsApi = {
  getGroups: () => apiClient.get('/groups'),
  getMyGroups: () => apiClient.get('/groups/mine'),
  getGroup: (id: string) => apiClient.get(`/groups/${id}`),
  join: (groupId: string) => apiClient.post(`/groups/${groupId}/join`),
  contribute: (groupId: string, data: { amountKes: number; mpesaRef: string; notes?: string }) =>
    apiClient.post(`/groups/${groupId}/contribute`, data),
  create: (data: object) => apiClient.post('/groups', data),
};

export const weatherApi = {
  getMyFarmWeather: () => apiClient.get('/weather/my-farm'),
  getForecast: () => apiClient.get('/weather/forecast'),
  getCountyWeather: (county: string) => apiClient.get(`/weather/county/${county}`),
};

export const insuranceApi = {
  getMyPolicies: () => apiClient.get('/insurance'),
  getPolicy: (id: string) => apiClient.get(`/insurance/${id}`),
  enroll: (data: object) => apiClient.post('/insurance', data),
};

export const predictApi = {
  predict: (data: object) => apiClient.post('/predict', data),
  getHistory: () => apiClient.get('/predict/history'),
};

export const supplyApi = {
  getStakeholders: (params?: { type?: string; county?: string }) => apiClient.get('/supply', { params }),
  getStakeholder: (id: string) => apiClient.get(`/supply/${id}`),
  create: (data: object) => apiClient.post('/supply', data),
};

export default apiClient;
