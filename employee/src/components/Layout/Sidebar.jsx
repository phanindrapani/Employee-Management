import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TEAM_PORTAL_URL } from '../../config';
import {
    Home,
    KeyRound,
    LogOut,
    FilePlus2,
    History,
    Calendar,
    Bell,
    LayoutTemplate
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Apply for Leave', path: '/apply-leave', icon: FilePlus2 },
        { name: 'History', path: '/leave-history', icon: History },
        { name: 'Holidays', path: '/holidays', icon: Calendar },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Security', path: '/change-password', icon: KeyRound },
    ];

    return (
        <div className="w-64 bg-[#0B3C5D] text-white h-screen flex flex-col sticky top-0 shadow-2xl">
            <div className="p-8 border-b border-[#1A4B6D]/50 flex justify-center">
                <span className="text-xl font-black tracking-tighter text-[#63C132]">EMPLOYEE</span>
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

                {/* Switch to Team Portal for Team Leads */}
                {user?.role === 'team-lead' && (
                    <button
                        onClick={() => window.location.href = TEAM_PORTAL_URL}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all w-full mt-4 bg-[#63C132]/10 text-[#63C132] font-bold border border-[#63C132]/20 hover:bg-[#63C132] hover:text-white group"
                    >
                        <div className="flex items-center gap-3">
                            <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                            Switch to Team Portal
                        </div>
                    </button>
                )}
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
