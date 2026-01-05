import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - 토큰 추가
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - 401 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; phone?: string; password?: string }) =>
    api.put('/auth/me', data),
};

// Property API
export const propertyApi = {
  getAll: (params?: { status?: string; propertyType?: string }) =>
    api.get('/properties', { params }),
  getOne: (id: number) => api.get(`/properties/${id}`),
  create: (data: Partial<any>) => api.post('/properties', data),
  update: (id: number, data: Partial<any>) => api.put(`/properties/${id}`, data),
  delete: (id: number) => api.delete(`/properties/${id}`),
  getSummary: (id: number) => api.get(`/properties/${id}/summary`),
};

// Tenant API
export const tenantApi = {
  getAll: () => api.get('/tenants'),
  getOne: (id: number) => api.get(`/tenants/${id}`),
  create: (data: Partial<any>) => api.post('/tenants', data),
  update: (id: number, data: Partial<any>) => api.put(`/tenants/${id}`, data),
  delete: (id: number) => api.delete(`/tenants/${id}`),
};

// Lease API
export const leaseApi = {
  getAll: (params?: { propertyId?: number; status?: string }) =>
    api.get('/leases', { params }),
  getOne: (id: number) => api.get(`/leases/${id}`),
  create: (data: Partial<any>) => api.post('/leases', data),
  update: (id: number, data: Partial<any>) => api.put(`/leases/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/leases/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/leases/${id}`),
  renew: (id: number, data: Partial<any>) => api.post(`/leases/${id}/renew`, data),
};

// RentPayment API
export const rentPaymentApi = {
  getAll: (params?: { leaseId?: number; propertyId?: number; year?: number; month?: number; status?: string }) =>
    api.get('/rent-payments', { params }),
  getOne: (id: number) => api.get(`/rent-payments/${id}`),
  create: (data: Partial<any>) => api.post('/rent-payments', data),
  generate: (data: { leaseId: number; startYear: number; startMonth: number; endYear: number; endMonth: number }) =>
    api.post('/rent-payments/generate', data),
  update: (id: number, data: Partial<any>) => api.put(`/rent-payments/${id}`, data),
  updateStatus: (id: number, data: { rentStatus?: string; managementFeeStatus?: string; paymentDate?: string }) =>
    api.patch(`/rent-payments/${id}/status`, data),
  delete: (id: number) => api.delete(`/rent-payments/${id}`),
  getOverdue: () => api.get('/rent-payments/overdue/list'),
};

// Expense API
export const expenseApi = {
  getAll: (params?: { propertyId?: number; expenseType?: string; year?: number }) =>
    api.get('/expenses', { params }),
  getOne: (id: number) => api.get(`/expenses/${id}`),
  create: (data: Partial<any>) => api.post('/expenses', data),
  update: (id: number, data: Partial<any>) => api.put(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
  getSummary: (params?: { propertyId?: number; year?: number }) =>
    api.get('/expenses/summary/stats', { params }),
};

// Valuation API
export const valuationApi = {
  calculate: (data: { propertyId: number; targetYield?: number; memo?: string }) =>
    api.post('/valuations/calculate', data),
  getAll: (params?: { propertyId?: number }) =>
    api.get('/valuations', { params }),
  getOne: (id: number) => api.get(`/valuations/${id}`),
  delete: (id: number) => api.delete(`/valuations/${id}`),
  getPortfolioSummary: () => api.get('/valuations/portfolio/summary'),
};
