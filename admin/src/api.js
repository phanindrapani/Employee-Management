import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

const API = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('ls_admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
