import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home,
    Calendar,
    ClipboardList,
    Users,
    LogOut,
    BarChart3,
    ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Leave Requests', path: '/leaves', icon: ClipboardList },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Holidays', path: '/holidays', icon: Calendar },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Security', path: '/change-password', icon: ShieldCheck },
    ];

    return (
        <div className="w-64 bg-[#0B3C5D] text-white h-screen flex flex-col sticky top-0 shadow-2xl">
            <div className="p-8 border-b border-[#1A4B6D]/50 flex justify-center">
                <span className="text-xl font-black tracking-tighter text-[#63C132]">ADMIN</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors
              ${isActive
                                ? 'bg-[#1A4B6D] text-white font-medium border-l-4 border-[#63C132]'
                                : 'text-gray-300 hover:bg-[#1A4B6D] hover:text-white'}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} />
                            {item.name}
                        </div>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-[#1A4B6D]">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 w-full text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
