import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Clear old generic keys to ensure migration to prefixed keys
        if (localStorage.getItem('token')) localStorage.removeItem('token');
        if (localStorage.getItem('user')) localStorage.removeItem('user');
        if (localStorage.getItem('profile')) localStorage.removeItem('profile');

        const token = localStorage.getItem('ls_emp_token');
        const cached = localStorage.getItem('ls_emp_profile');
        // Prevent stale-login state: profile without token should not be treated as authenticated.
        return token && cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!user);

    const refreshProfile = async () => {
        const token = localStorage.getItem('ls_emp_token');
        if (!token) return null;
        try {
            const { data } = await API.get('/auth/profile');
            const profileStr = JSON.stringify(data);
            if (localStorage.getItem('ls_emp_profile') !== profileStr) {
                setUser(data);
                localStorage.setItem('ls_emp_profile', profileStr);
            }
            return data;
        } catch (error) {
            localStorage.removeItem('ls_emp_token');
            localStorage.removeItem('ls_emp_profile');
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        refreshProfile().finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('ls_emp_token', data.token);
        localStorage.setItem('ls_emp_profile', JSON.stringify(data));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('ls_emp_token');
        localStorage.removeItem('ls_emp_profile');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
