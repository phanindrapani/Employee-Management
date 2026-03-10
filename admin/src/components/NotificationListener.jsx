import React from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useToast } from '../context/ToastContext';

const NotificationListener = () => {
    const { showToast } = useToast();

    useSocketListener('notification', (data) => {
        showToast(data.message, 'info');
    });

    useSocketListener('leave:created', (data) => {
        showToast(`New Leave Request from ${data.user?.name || 'Employee'}`, 'info');
    });

    useSocketListener('leave:updated', (data) => {
        showToast(`Leave Request ${data.status}`, data.status === 'approved' ? 'success' : 'warning');
    });

    useSocketListener('task:assigned', (data) => {
        showToast(`New Task Assigned: ${data.title}`, 'info');
    });



    useSocketListener('task:updated', (data) => {
        // Optional: too noisy?
    });

    return null; // This component doesn't render anything itself
};

export default NotificationListener;
