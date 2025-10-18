import axios from 'axios';

const API_URL = 'http://localhost:5011/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  growerLogin: (email, password) => 
    api.post('/auth/grower-login', { email, password }),

  growerRegister: (name, email, contactNo, address, password) =>
    api.post('/auth/grower-register', { name, email, contactNo, address, password }),
  
  customerRegister: (name, email, contactNo, address, password) =>
    api.post('/auth/customer-register', { name, email, contactNo, address, password }),
  
  customerLogin: (email, password) =>
    api.post('/auth/customer-login', { email, password }),

  adminLogin: (username, password) =>
    api.post('/auth/admin-login', { username, password })
};

// Grower APIs
export const growerAPI = {
  getDetails: (id) => api.get(`/growers/${id}`),
  
  getPlots: (id) => api.get(`/growers/${id}/plots`),
  
  getProducts: (id) => api.get(`/growers/${id}/products`)
};

// Product APIs
export const productAPI = {
  getAll: () => api.get('/products'),
  
  addProduct: (name, category, pricePerUnit, growerID) =>
    api.post('/products', { name, category, pricePerUnit, growerID }),
  
  addHarvestBatch: (productID, batchNo, harvestDate, expiryDate, quantityAvailable) =>
    api.post('/harvest-batch', { productID, batchNo, harvestDate, expiryDate, quantityAvailable })
};

// Recommendation APIs
export const recommendationAPI = {
  getRecommendations: (params) => api.get('/recommendations', { params }),
  
  addRecommendation: (data) => api.post('/recommendations', data)
};

// Order APIs
export const orderAPI = {
  createOrder: (customerID, items) =>
    api.post('/orders', { customerID, items }),
  
  getCustomerOrders: (id) => api.get(`/customers/${id}/orders`),
  
  getOrderItems: (id) => api.get(`/orders/${id}/items`)
};

// Payment APIs
export const paymentAPI = {
  createPayment: (orderID, mode, amount) =>
    api.post('/payments', { orderID, mode, amount }),
  
  getOrderPayment: (id) => api.get(`/orders/${id}/payment`)
};

// Admin APIs
export const adminAPI = {
  // Growers
  getAllGrowers: () => api.get('/admin/growers'),
  updateGrower: (id, data) => api.put(`/admin/growers/${id}`, data),

  // Products
  getAllProducts: () => api.get('/admin/products'),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),

  // Orders
  getAllOrders: () => api.get('/admin/orders'),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),

  // Customers
  getAllCustomers: () => api.get('/admin/customers'),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),

  // Payments
  getAllPayments: () => api.get('/admin/payments'),

  // Recommendations
  getAllRecommendations: () => api.get('/admin/recommendations'),

  // Harvest Batches
  getAllHarvestBatches: () => api.get('/admin/harvest-batches')
};

export default api;