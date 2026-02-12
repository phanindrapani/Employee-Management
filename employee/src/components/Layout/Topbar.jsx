import React, { useState, useEffect } from 'react';
import { Bell, User, Check, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import manuenLogo from '../../assets/manuen_logo.png';
import manuenSquare from '../../assets/manuen_square.png';

const Topbar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await API.get('/notifications');
                setNotifications(data);
            } catch (err) {
                console.error('Failed to fetch notifications');
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAllRead = async () => {
        try {
            await API.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read');
        }
    };

    return (
        <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center mr-6 py-2 border-r border-slate-100 pr-6">
                    <img src={manuenSquare} alt="Logo" className="h-8 w-8 relative z-10" />
                    <img src={manuenLogo} alt="Manuen" className="h-10 -ml-5" />
                </div>
                <h2 className="text-lg font-medium text-slate-700">
                    {location.pathname === '/' ? `Welcome back, ${user.name}` : ''}
                </h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-full transition-all relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all as read</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n._id} className={`p-4 border-b border-slate-50 last:border-0 ${n.isRead ? 'opacity-60' : 'bg-primary-50/30'}`}>
                                            <p className="text-sm text-slate-700">{n.message}</p>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 overflow-hidden border border-slate-200">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
