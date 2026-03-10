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
    ShieldCheck,
    Clock3,
    TableProperties,
    X,
    Ticket
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle }) => {
    const { user, logout } = useAuth();
    const handleSwitchToTeamPortal = () => {
        // localStorage is origin-scoped, so employee portal cannot clear teamlead storage directly.
        // Send a flag so teamlead app clears its own auth and forces fresh login.
        window.location.href = `${TEAM_PORTAL_URL}?forceLogin=1`;
    };

    const navSections = [
        {
            title: 'DASHBOARD',
            items: [
                { name: 'Summary', path: '/', icon: Home },
                { name: 'My Tasks', path: '/tasks', icon: ClipboardList },
                { name: 'My Projects', path: '/projects', icon: FolderKanban },
                { name: 'My Tickets', path: '/tickets', icon: Ticket },
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
                { name: 'Attendance', path: '/attendance', icon: Clock3 },
                { name: 'My Profile', path: '/profile', icon: User },
                { name: 'My Documents', path: '/documents', icon: FileText },
                { name: 'Worksheet', path: '/worksheet', icon: TableProperties },
                { name: 'Security', path: '/change-password', icon: ShieldCheck },
            ]
        }
    ];

    return (
        <div className={`
            fixed lg:sticky top-0 left-0 z-50 w-64 bg-[#0B3C5D] text-white h-screen flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-8 border-b border-[#1A4B6D]/50 flex flex-col items-center gap-2 relative bg-[#0B3C5D]">
                <button onClick={toggle} className="lg:hidden absolute top-4 right-4 text-gray-300 hover:text-white p-1">
                    <X size={20} />
                </button>
                <span className="text-xl font-black tracking-tighter text-[#63C132] text-center">EMPLOYEE</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Employee Portal</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {navSections.map((section) => (
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
                                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#1A4B6D] text-white font-bold border-l-4 border-[#63C132] shadow-lg shadow-black/20'
                                            : 'text-slate-400 hover:bg-[#1A4B6D]/50 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Switch to Team Portal for Team Leads */}
                {user?.role === 'team-lead' && (
                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={handleSwitchToTeamPortal}
                            className="flex items-center gap-3 px-3 py-3 w-full text-sm font-bold text-[#63C132] bg-[#63C132]/5 rounded-xl border border-[#63C132]/10 hover:bg-[#63C132] hover:text-white transition-all transform hover:scale-[1.02]"
                        >
                            <LayoutTemplate size={18} />
                            Switch to Team Lead Portal
                        </button>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-[#1A4B6D]">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
                >
                    <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
