import React, { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle2,
    Clock,
    AlertCircle,
    CheckCheck,
    Trash2,
    CalendarCheck,
    MessageSquare
} from 'lucide-react';
import API from '../../api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await API.get('/notifications');
                setNotifications(data);
                setLoading(false);
            } catch (error) {
                console.error("Fetch notifications error:", error);
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
        try {
            await API.put('/notifications/mark-read');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Mark all as read error:", error);
        }
    };

    if (loading) return <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-3xl"></div>)}
    </div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Operational Alerts</h1>
                    <p className="text-slate-500 font-medium">Real-time Intelligence • Team Activity & System Notifications</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-6 py-3 bg-[#63C132]/10 text-[#63C132] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#63C132] hover:text-white transition-all border border-[#63C132]/20 shadow-sm"
                    >
                        <CheckCheck size={16} />
                        Clear Unread
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {notifications.length > 0 ? notifications.map((notification) => (
                    <div
                        key={notification._id}
                        className={`group p-8 rounded-[32px] border transition-all duration-300 flex items-start gap-6 relative overflow-hidden ${notification.isRead
                                ? 'bg-white border-slate-100 opacity-75'
                                : 'bg-white border-[#63C132]/20 shadow-xl shadow-slate-200/50'
                            }`}
                    >
                        {!notification.isRead && (
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#63C132]"></div>
                        )}

                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${notification.isRead ? 'bg-slate-50 text-slate-300' : 'bg-[#0B3C5D]/5 text-[#0B3C5D]'
                            }`}>
                            {notification.message.toLowerCase().includes('task') ? <CalendarCheck size={24} /> :
                                notification.message.toLowerCase().includes('leave') ? <Clock size={24} /> :
                                    <MessageSquare size={24} />}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {new Date(notification.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                </span>
                                {!notification.isRead && (
                                    <span className="px-3 py-1 bg-[#63C132] text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-[#63C132]/30">New Alert</span>
                                )}
                            </div>
                            <p className={`text-base font-semibold leading-relaxed ${notification.isRead ? 'text-slate-500' : 'text-[#0B3C5D]'}`}>
                                {notification.message}
                            </p>
                        </div>

                        <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all">
                            <Trash2 size={20} />
                        </button>
                    </div>
                )) : (
                    <div className="py-32 bg-white rounded-[40px] border border-slate-100 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                            <Bell size={32} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No operational alerts found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
