import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home,
    Calendar,
    ClipboardList,
    Users,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Leave Requests', path: '/leaves', icon: ClipboardList },
        { name: 'Holiday Management', path: '/holidays', icon: Calendar },
        { name: 'Employee Mgmt', path: '/employees', icon: Users },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl text-primary-600">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                        L
                    </div>
                    LeaveFlow Admin
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center justify-between px-3 py-2 rounded-lg transition-colors
              ${isActive
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} />
                            {item.name}
                        </div>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
