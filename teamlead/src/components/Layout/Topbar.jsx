import React, { useState, useEffect } from 'react';
import { Bell, User, Check, Trash2, Menu } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import manuenLogo from '../../assets/manuen_logo.png';
import manuenSquare from '../../assets/manuen_square.png';
import useSocketListener from '../../hooks/useSocketListener';

const Topbar = ({ toggleSidebar }) => {
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
        <div className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center md:mr-6 md:py-2 md:border-r md:border-slate-100 md:pr-6">
                    <img src={manuenSquare} alt="Logo" className="h-8 w-8 relative z-10" />
                    <img src={manuenLogo} alt="Manuen" className="h-10 -ml-5" />
                </div>
                <h2 className="text-lg font-medium text-slate-700 hidden md:block">
                    {location.pathname === '/' ? `Welcome back, ${user.name}` : ''}
                </h2>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
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

                <Link to="/profile" className="flex items-center gap-3 md:pl-6 md:border-l md:border-slate-200 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
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
                </Link>
            </div>
        </div>
    );
};

export default Topbar;
