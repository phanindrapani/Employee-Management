import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('client_token');
        const stored = localStorage.getItem('client_user');
        if (token && stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem('client_token');
                localStorage.removeItem('client_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        if (data.role !== 'client') throw new Error('Access denied. Client accounts only.');

        localStorage.setItem('client_token', data.token);
        localStorage.setItem('client_user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const register = async (form) => {
        const { data } = await API.post('/auth/register', { ...form, role: 'client' });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('client_token');
        localStorage.removeItem('client_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
