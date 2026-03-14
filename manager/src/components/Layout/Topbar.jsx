import React, { useState, useEffect, useCallback } from 'react';
import { Bell, User, Menu, Search } from 'lucide-react';
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

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await API.get('/notifications');
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useSocketListener('notification', fetchNotifications);
    useSocketListener('leave:updated', fetchNotifications);
    useSocketListener('task:assigned', fetchNotifications);
    useSocketListener('ticket:assigned', fetchNotifications);

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
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center md:mr-6 md:py-2 md:border-r md:border-slate-100 md:pr-6">
                    <img src={manuenSquare} alt="Logo" className="h-8 w-8 relative z-10" />
                    <img src={manuenLogo} alt="Manuen" className="h-10 -ml-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-700 hidden md:block">
                    {location.pathname === '/' ? `Welcome back, ${user?.name}` : ''}
                </h2>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-400 hover:text-[#0B3C5D] hover:bg-slate-50 rounded-full transition-all relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-[#63C132] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-[#0B3C5D] text-sm">Notifications</h3>
                                <button onClick={markAllRead} className="text-[10px] font-bold text-[#63C132] uppercase tracking-wider hover:underline">Mark all read</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400 font-medium">No new notifications</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n._id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${n.isRead ? 'opacity-50' : 'bg-primary-50/30'}`}>
                                            <p className="text-xs font-semibold text-slate-700 leading-relaxed">{n.message}</p>
                                            <span className="text-[9px] font-bold text-slate-300 mt-2 block uppercase tracking-tighter">
                                                {new Date(n.createdAt).toLocaleString()}
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
                        <p className="text-sm font-black text-[#0B3C5D]">{user?.name || 'Manager'}</p>
                        <p className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em]">{user?.role || 'Super Manager'}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 overflow-hidden border border-slate-200 shadow-sm">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#0B3C5D] flex items-center justify-center text-white font-black">
                                {user?.name?.charAt(0) || 'M'}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Topbar;