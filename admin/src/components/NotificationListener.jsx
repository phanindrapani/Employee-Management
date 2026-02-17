import React from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useToast } from '../context/ToastContext';

const NotificationListener = () => {
    const { addToast } = useToast();

    useSocketListener('notification:new', (data) => {
        addToast(data.message, 'info');
    });

    useSocketListener('leave:created', (data) => {
        addToast(`New Leave Request from ${data.user?.name || 'Employee'}`, 'info');
    });

    useSocketListener('leave:updated', (data) => {
        addToast(`Leave Request ${data.status}`, data.status === 'approved' ? 'success' : 'warning');
    });

    useSocketListener('task:assigned', (data) => {
        addToast(`New Task Assigned: ${data.title}`, 'info');
    });

    useSocketListener('task:updated', (data) => {
        // Optional: too noisy?
    });

    return null; // This component doesn't render anything itself
};

export default NotificationListener;
