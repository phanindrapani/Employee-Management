import React from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useToast } from '../context/ToastContext';

const NotificationListener = () => {
    const { addToast } = useToast();

    useSocketListener('notification:new', (data) => {
        addToast(data.message, 'info');
    });

    useSocketListener('leave:created', (data) => {
        addToast(`New Leave Request from ${data.user?.name || 'Member'}`, 'info');
    });

    useSocketListener('leave:updated', (data) => {
        addToast(`Leave Request ${data.status}`, data.status === 'approved' || data.status === 'tl-approved' ? 'success' : 'warning');
    });

    useSocketListener('task:assigned', (data) => {
        addToast(`New Task Assigned: ${data.title}`, 'info');
    });

    useSocketListener('task:completed', (data) => {
        addToast(`Task Completed: ${data.title}`, 'success');
    });

    return null;
};

export default NotificationListener;
