import React from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useToast } from '../context/ToastContext';

const NotificationListener = () => {
    const { showToast } = useToast();

    useSocketListener('notification', (data) => {
        showToast(data.message, 'info');
    });

    useSocketListener('leave:updated', (data) => {
        showToast(`Leave Request ${data.status}`, data.status === 'approved' ? 'success' : 'warning');
    });

    useSocketListener('task:assigned', (data) => {
        showToast(`New Task Assigned: ${data.title}`, 'info');
    });



    useSocketListener('performance:updated', (data) => {
        showToast(`Your performance Score Updated: ${data.totalScore}`, 'success');
    });

    return null;
};

export default NotificationListener;
