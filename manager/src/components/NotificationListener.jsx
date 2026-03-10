import React from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useToast } from '../context/ToastContext';

const NotificationListener = () => {
    const { showToast } = useToast();

    useSocketListener('notification', (data) => {
        showToast(data.message, 'info');
    });

    return null;
};

export default NotificationListener;
