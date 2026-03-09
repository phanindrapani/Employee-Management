import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('ls_manager_token');
        const cached = localStorage.getItem('ls_manager_profile');
        try {
            return token && cached && cached !== 'undefined' ? JSON.parse(cached) : null;
        } catch (e) {
            console.error("Failed to parse cached profile", e);
            return null;
        }
    });
    const [loading, setLoading] = useState(!user);

    const login = async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        localStorage.setItem('ls_manager_token', res.data.token);
        localStorage.setItem('ls_manager_profile', JSON.stringify(res.data));
        setUser(res.data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('ls_manager_token');
        localStorage.removeItem('ls_manager_profile');
        setUser(null);
    };

    const checkAuth = async () => {
        try {
            const res = await API.get('/auth/profile');
            setUser(res.data);
            localStorage.setItem('ls_manager_profile', JSON.stringify(res.data));
        } catch (err) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('ls_manager_token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);
