// API Service Layer for Trackify
// Centralized API calls with error handling

// Use environment variable or fallback to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Generic fetch wrapper with auth header
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}

// Auth API
export const authAPI = {
  register: (name: string, email: string, password: string) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyEmail: (email: string, otp: string) =>
    fetchWithAuth('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendOTP: (email: string) =>
    fetchWithAuth('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),
};

// User API
export const userAPI = {
  getCurrentUser: () => fetchWithAuth('/users'),

  updateProfile: (name: string, email: string, avatarUrl?: string) =>
    fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email, avatarUrl }),
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    fetchWithAuth('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  exportData: (currency?: string) => fetchWithAuth(`/users/export?currency=${currency || 'INR'}`),
};

// Transactions API
export const transactionAPI = {
  getTransactions: (filters?: { category?: string; startDate?: string; endDate?: string; type?: 'income' | 'expense' }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/transactions${query}`);
  },

  addTransaction: (transaction: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    description?: string;
  }) =>
    fetchWithAuth('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),

  updateTransaction: (id: string, transaction: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    description?: string;
  }) =>
    fetchWithAuth(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    }),

  deleteTransaction: (id: string) =>
    fetchWithAuth(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  getMonthlySummary: () => fetchWithAuth('/transactions/summary'),
};

// Budgets API
export const budgetAPI = {
  getBudgets: () => fetchWithAuth('/budgets'),

  addBudget: (budget: { category: string; amount: number; period: 'monthly' | 'yearly' }) =>
    fetchWithAuth('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),

  deleteBudget: (id: string) =>
    fetchWithAuth(`/budgets/${id}`, {
      method: 'DELETE',
    }),
};
