import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth
export const registerUser   = (data)        => API.post('/auth/register', data);
export const loginUser      = (data)        => API.post('/auth/login', data);
export const forgotPassword = (data)        => API.post('/auth/forgot-password', data);
export const resetPassword  = (token, data) => API.post(`/auth/reset-password/${token}`, data);

// Customers
export const getCustomers   = ()         => API.get('/customers');
export const getCustomer    = (id)       => API.get(`/customers/${id}`);
export const createCustomer = (data)     => API.post('/customers', data);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer = (id)       => API.delete(`/customers/${id}`);
export const sendReminder   = (id)       => API.post(`/customers/${id}/remind`);
export const renewAMC       = (id, data) => API.post(`/customers/${id}/renew`, data);

// Service Visits
export const getServiceVisits           = ()         => API.get('/service');
export const getServiceVisitsByCustomer = (id)       => API.get(`/service/customer/${id}`);
export const createServiceVisit         = (data)     => API.post('/service', data);
export const updateServiceVisit         = (id, data) => API.put(`/service/${id}`, data);
export const deleteServiceVisit         = (id)       => API.delete(`/service/${id}`);

// Payments
export const getPayments   = ()          => API.get('/payments');
export const createPayment = (data)      => API.post('/payments', data);
export const updatePayment = (id, data)  => API.put(`/payments/${id}`, data);
export const deletePayment = (id)        => API.delete(`/payments/${id}`);
export const getPaymentsByCustomer = (id) => API.get(`/payments/customer/${id}`);

// Reports
export const getReports = () => API.get('/reports');

// Settings
export const getSettings        = ()     => API.get('/settings');
export const updateSettings     = (data) => API.put('/settings', data);
export const changePassword     = (data) => API.put('/settings/change-password', data);

// Bills
export const uploadBill  = (customerId, formData) =>
  API.post(`/bills/${customerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteBill  = (customerId, billId) =>
  API.delete(`/bills/${customerId}/${billId}`);

//search
export const searchAll = (q) => API.get(`/search?q=${encodeURIComponent(q)}`);