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
    ExternalLink,
    X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle }) => {
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
                { name: 'My Profile', path: '/profile', icon: UserCircle },
            ]
        }
    ];

    return (
        <div className={`
            fixed lg:sticky top-0 left-0 z-50 w-64 bg-[#0B3C5D] text-white h-screen flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            {/* Header / Logo */}
            <div className="p-8 border-b border-[#1A4B6D]/50 flex flex-col items-center gap-2 relative bg-[#0B3C5D]">
                <button onClick={toggle} className="lg:hidden absolute top-4 right-4 text-gray-300 hover:text-white p-1">
                    <X size={20} />
                </button>
                <span className="text-xl font-black tracking-tighter text-[#63C132] text-center italic">TEAM<span>LEAD</span></span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Control Center</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-2">
                        <h3 className="px-3 text-xs font-bold uppercase tracking-[0.15em] !text-slate-300 mt-6 mb-3">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-[#1A4B6D] text-white font-bold shadow-lg shadow-black/20 border-l-4 border-[#63C132]'
                                            : 'text-slate-400 hover:bg-[#1A4B6D]/50 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={18} className="group-hover:scale-110 transition-transform" />
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
            <div className="p-4 border-t border-[#1A4B6D]">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors font-semibold"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
