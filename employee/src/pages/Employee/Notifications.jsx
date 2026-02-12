import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Bell, Check, Trash2, Clock } from 'lucide-react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await API.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete notification');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                        <Bell size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
                        <p className="text-slate-500 font-medium italic">Stay updated with your leave requests</p>
                    </div>
                </div>
                <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span className="text-[#63C132] mr-2">{notifications.filter(n => !n.isRead).length}</span> Unread
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-[32px] p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border border-slate-50 shadow-sm">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center text-slate-300 border border-slate-50 shadow-sm">
                        <Bell size={64} className="mx-auto mb-6 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-sm">Everything is clear</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n._id}
                            className={`group relative bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${!n.isRead ? 'ring-2 ring-[#63C132]/20' : 'opacity-60 grayscale'}`}
                        >
                            <div className="flex items-start gap-6">
                                <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${!n.isRead ? 'bg-[#F0FFF4] text-[#63C132]' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell size={24} />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className={`text-lg font-bold tracking-tight ${!n.isRead ? 'text-[#0B3C5D]' : 'text-slate-500'}`}>
                                            {n.message}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            <Clock size={12} />
                                            {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                                        Action required or status update regarding your recent leave application.
                                    </p>

                                    <div className="flex items-center gap-6 mt-8">
                                        {!n.isRead && (
                                            <button
                                                onClick={() => markAsRead(n._id)}
                                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#63C132] hover:bg-[#F0FFF4] px-4 py-2 rounded-xl transition-all"
                                            >
                                                <Check size={16} /> Mark Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(n._id)}
                                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 px-4 py-2 rounded-xl transition-all ml-auto"
                                        >
                                            <Trash2 size={16} /> Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
