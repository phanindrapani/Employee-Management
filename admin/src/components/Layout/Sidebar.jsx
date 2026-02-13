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
    ShieldCheck,
    Building2,
    Users2,
    FolderKanban,
    PlusSquare
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    const sections = [
        {
            title: 'Dashboard',
            items: [
                { name: 'System Overview', path: '/', icon: Home },
                { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
            ]
        },
        {
            title: 'Organization',
            items: [
                { name: 'Employees', path: '/employees', icon: Users },
                { name: 'Departments', path: '/departments', icon: Building2 },
                { name: 'Teams', path: '/teams', icon: Users2 },
            ]
        },
        {
            title: 'Project Management',
            items: [
                { name: 'All Projects', path: '/projects', icon: FolderKanban },
                { name: 'Create Project', path: '/projects/create', icon: PlusSquare },
            ]
        },
        {
            title: 'HR Operations',
            items: [
                { name: 'Leave Requests', path: '/leaves', icon: ClipboardList },
                { name: 'Holiday Calendar', path: '/holidays', icon: Calendar },
            ]
        },
        {
            title: 'Settings',
            items: [
                { name: 'Security', path: '/change-password', icon: ShieldCheck },
            ]
        }
    ];

    return (
        <div className="w-64 bg-[#0B3C5D] text-white h-screen flex flex-col sticky top-0 shadow-2xl overflow-y-auto">
            <div className="p-8 border-b border-[#1A4B6D]/50 flex flex-col items-center gap-2">
                <span className="text-xl font-black tracking-tighter text-[#63C132]">CORPORATE ERP</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Admin Portal</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-8">
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
                                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#1A4B6D] text-white font-bold shadow-lg shadow-black/20 border-l-4 border-[#63C132]'
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
