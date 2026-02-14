import axios from 'axios';
import { API_BASE_URL } from './config';

const API = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
