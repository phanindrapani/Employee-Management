import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TEAM_PORTAL_URL } from '../../config';
import {
    Home,
    LogOut,
    FilePlus2,
    History,
    Calendar,
    Bell,
    LayoutTemplate,
    FolderKanban,
    ClipboardList,
    User,
    FileText,
    ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navSections = [
        {
            title: 'DASHBOARD',
            items: [
                { name: 'Summary', path: '/', icon: Home },
                { name: 'My Tasks', path: '/tasks', icon: ClipboardList },
                { name: 'My Projects', path: '/projects', icon: FolderKanban },
            ]
        },
        {
            title: 'LEAVE MANAGEMENT',
            items: [
                { name: 'Apply Leave', path: '/apply-leave', icon: FilePlus2 },
                { name: 'Leave History', path: '/leave-history', icon: History },
                { name: 'Holidays', path: '/holidays', icon: Calendar },
            ]
        },
        {
            title: 'PERSONAL',
            items: [
                { name: 'My Profile', path: '/profile', icon: User },
                { name: 'My Documents', path: '/documents', icon: FileText },
                { name: 'Security', path: '/change-password', icon: ShieldCheck },
            ]
        }
    ];

    return (
        <div className="w-64 bg-[#0B3C5D] text-white h-screen flex flex-col sticky top-0 shadow-2xl">
            <div className="p-8 border-b border-[#1A4B6D]/50 flex justify-center">
                <span className="text-xl font-black tracking-tighter text-[#63C132]">EMPLOYEE</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <h4 className="px-3 text-[10px] font-bold !text-slate-300 uppercase tracking-[0.2em] mb-2">
                            {section.title}
                        </h4>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#1A4B6D] text-white font-bold border-l-4 border-[#63C132] shadow-lg shadow-black/10'
                                            : 'text-gray-300 hover:bg-[#1A4B6D]/50 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Switch to Team Portal for Team Leads */}
                {user?.role === 'team-lead' && (
                    <button
                        onClick={() => window.location.href = TEAM_PORTAL_URL}
                        className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg transition-all w-full mt-4 bg-[#63C132]/10 text-[#63C132] font-black uppercase text-[9px] tracking-widest border border-[#63C132]/20 hover:bg-[#63C132] hover:text-white shadow-sm overflow-hidden whitespace-nowrap"
                    >
                        <LayoutTemplate size={16} className="shrink-0" />
                        <span className="flex-1 text-left">Switch to Team Portal</span>
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
