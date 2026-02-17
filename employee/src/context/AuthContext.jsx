import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Clear old generic keys to ensure migration to prefixed keys
        if (localStorage.getItem('token')) localStorage.removeItem('token');
        if (localStorage.getItem('user')) localStorage.removeItem('user');
        if (localStorage.getItem('profile')) localStorage.removeItem('profile');

        const cached = localStorage.getItem('ls_emp_profile');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('ls_emp_token');
            if (token) {
                try {
                    const { data } = await API.get('/auth/profile');
                    setUser(data);
                    localStorage.setItem('ls_emp_profile', JSON.stringify(data));
                } catch (error) {
                    localStorage.removeItem('ls_emp_token');
                    localStorage.removeItem('ls_emp_profile');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
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
        <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
