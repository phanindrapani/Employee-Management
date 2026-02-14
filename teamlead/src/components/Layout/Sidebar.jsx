import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EMPLOYEE_PORTAL_URL } from '../../config';
import {
    Home,
    Users,
    FolderKanban,
    ClipboardList,
    CalendarDays,
    BarChart3,
    Bell,
    UserCircle,
    LogOut,
    ExternalLink
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    const sections = [
        {
            title: 'CORE',
            items: [
                { name: 'Dashboard', path: '/', icon: Home },
            ]
        },
        {
            title: 'MANAGEMENT',
            items: [
                { name: 'My Team', path: '/team', icon: Users },
                { name: 'Projects', path: '/projects', icon: FolderKanban },
                { name: 'Tasks', path: '/tasks', icon: ClipboardList },
            ]
        },
        {
            title: 'OPERATIONS',
            items: [
                { name: 'Leave Overview', path: '/leaves', icon: CalendarDays },
                { name: 'Reports', path: '/reports', icon: BarChart3 },
            ]
        },
        {
            title: 'PERSONAL',
            items: [
                { name: 'Notifications', path: '/notifications', icon: Bell },
                { name: 'My Profile', path: '/profile', icon: UserCircle },
            ]
        }
    ];

    return (
        <div className="w-72 bg-[#0B3C5D] text-white h-screen flex flex-col sticky top-0 shadow-2xl border-r border-white/5">
            {/* Header / Logo */}
            <div className="p-8 border-b border-white/5 flex flex-col items-center gap-2">
                <span className="text-2xl font-black tracking-tighter text-[#63C132] italic">TEAM<span>LEAD</span></span>
                <div className="px-3 py-1 bg-[#63C132]/10 rounded-full text-[10px] font-bold text-[#63C132] uppercase tracking-widest border border-[#63C132]/20">
                    Control Center
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-2">
                        <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {section.title}
                        </h4>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-[#1A4B6D] text-white font-bold shadow-lg shadow-black/20 border-l-4 border-[#63C132]'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm tracking-tight">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Switch to Employee Portal */}
                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={() => window.location.href = EMPLOYEE_PORTAL_URL}
                        className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold text-[#63C132] bg-[#63C132]/5 rounded-xl border border-[#63C132]/10 hover:bg-[#63C132] hover:text-white transition-all transform hover:scale-[1.02]"
                    >
                        <ExternalLink size={18} />
                        Employee Portal
                    </button>
                </div>
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors font-semibold"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
