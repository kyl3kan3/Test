import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healthapp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('healthapp_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Object
export const apiService = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.Authorization;
    }
  },

  // Authentication endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (userData) => api.put('/auth/profile', userData),
    changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
    verifyToken: () => api.get('/auth/verify'),
  },

  // User endpoints
  users: {
    getDashboard: () => api.get('/users/dashboard'),
    updateRecommendationStatus: (recommendationId, status) =>
      api.put(`/users/recommendations/${recommendationId}/status`, { status }),
    getTimeline: () => api.get('/users/timeline'),
    addHealthGoal: (goal) => api.post('/users/health-goals', { goal }),
    removeHealthGoal: (goal) => api.delete(`/users/health-goals/${encodeURIComponent(goal)}`),
  },

  // Supplements endpoints
  supplements: {
    getAll: (params) => api.get('/supplements', { params }),
    getById: (id) => api.get(`/supplements/${id}`),
    search: (criteria) => api.post('/supplements/search', criteria),
    getCategories: () => api.get('/supplements/meta/categories'),
    getConditions: () => api.get('/supplements/meta/conditions'),
    getForGoals: (healthGoals) => api.post('/supplements/for-goals', { healthGoals }),
    checkInteractions: (data) => api.post('/supplements/check-interactions', data),
    getPopular: () => api.get('/supplements/meta/popular'),
  },

  // Blood work endpoints
  bloodwork: {
    upload: (formData) => 
      api.post('/bloodwork/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    addManual: (data) => api.post('/bloodwork/manual', data),
    getAll: (params) => api.get('/bloodwork', { params }),
    getById: (id) => api.get(`/bloodwork/${id}`),
    analyze: (id) => api.post(`/bloodwork/${id}/analyze`),
    updateResults: (id, results) => api.put(`/bloodwork/${id}/results`, { results }),
    delete: (id) => api.delete(`/bloodwork/${id}`),
    getTrends: (markers) => api.get('/bloodwork/trends/markers', { params: { markers } }),
  },

  // AI endpoints
  ai: {
    generateRecommendations: (data) => api.post('/ai/recommendations', data),
    getRecommendations: () => api.get('/ai/recommendations'),
    analyzeBloodwork: (bloodworkId) => api.post(`/ai/analyze-bloodwork/${bloodworkId}`),
    getEducation: (topic) => api.post('/ai/education', { topic }),
    chat: (data) => api.post('/ai/chat', data),
    checkInteractions: (data) => api.post('/ai/check-interactions', data),
    getInsights: () => api.get('/ai/insights'),
  },

  // Health check
  health: () => api.get('/health'),
};

// Utility functions
export const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.error || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
    };
  }
};

export default api;