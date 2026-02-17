import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Clear old generic keys to ensure migration to prefixed keys
        if (localStorage.getItem('token')) localStorage.removeItem('token');
        if (localStorage.getItem('user')) localStorage.removeItem('user');
        if (localStorage.getItem('profile')) localStorage.removeItem('profile');

        const forceLogin = new URLSearchParams(window.location.search).get('forceLogin') === '1';
        if (forceLogin) {
            localStorage.removeItem('ls_tl_token');
            localStorage.removeItem('ls_tl_profile');
            console.log('[DEBUG] TL AuthContext init: forceLogin=1, cleared TL auth storage');
            return null;
        }

        const cached = localStorage.getItem('ls_tl_profile');
        console.log('[DEBUG] TL AuthContext init: ls_tl_profile =', cached ? 'FOUND' : 'NULL');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const params = new URLSearchParams(window.location.search);
            const forceLogin = params.get('forceLogin') === '1';
            if (forceLogin) {
                params.delete('forceLogin');
                const newSearch = params.toString();
                const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
                window.history.replaceState({}, '', newUrl);
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('ls_tl_token');
            console.log('[DEBUG] TL AuthContext check: ls_tl_token =', token ? 'FOUND' : 'NULL');
            if (token) {
                try {
                    const { data } = await API.get('/auth/profile');
                    setUser(data);
                    localStorage.setItem('ls_tl_profile', JSON.stringify(data));
                } catch (error) {
                    localStorage.removeItem('ls_tl_token');
                    localStorage.removeItem('ls_tl_profile');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('ls_tl_token', data.token);
        localStorage.setItem('ls_tl_profile', JSON.stringify(data));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('ls_tl_token');
        localStorage.removeItem('ls_tl_profile');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
