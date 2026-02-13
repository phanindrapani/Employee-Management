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
    PlusSquare,
    Activity,
    PieChart,
    Sliders,
    UserCircle
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const allSections = [
        {
            title: 'Dashboard',
            items: [
                { name: 'System Overview', path: '/', icon: Home, roles: ['admin'] },
            ]
        },
        {
            title: 'Organization',
            items: [
                { name: 'Employees', path: '/employees', icon: Users, roles: ['admin'] },
                { name: 'Departments', path: '/departments', icon: Building2, roles: ['admin'] },
                { name: 'Teams', path: '/teams', icon: Users2, roles: ['admin'] },
            ]
        },
        {
            title: 'Project Management',
            items: [
                { name: 'All Projects', path: '/projects', icon: FolderKanban, roles: ['admin'] },
                { name: 'Create Project', path: '/projects/create', icon: PlusSquare, roles: ['admin'] },
                { name: 'Project Analytics', path: '/projects/reports', icon: BarChart3, roles: ['admin'] },
            ]
        },
        {
            title: 'Leave Management',
            items: [
                { name: 'Leave Requests', path: '/leaves', icon: ClipboardList, roles: ['admin', 'employee'] }, // Employees might need this later
                { name: 'Leave Analytics', path: '/reports', icon: BarChart3, roles: ['admin'] },
            ]
        },
        {
            title: 'Holiday Management',
            items: [
                { name: 'Holiday Calendar', path: '/holidays', icon: Calendar, roles: ['admin', 'employee'] },
            ]
        },
        {
            title: 'Reports & Analytics',
            items: [
                { name: 'Employee Performance', path: '/employee-performance', icon: Users, roles: ['admin'] },
            ]
        },
        {
            title: 'Settings',
            items: [
                { name: 'Leave Settings', path: '/leave-settings', icon: Sliders, roles: ['admin'] },
                { name: 'Roles & Permissions', path: '/settings/roles', icon: ShieldCheck, roles: ['admin'] },
                { name: 'Profile', path: '/settings/profile', icon: UserCircle, roles: ['admin', 'employee'] },
                { name: 'Security', path: '/change-password', icon: ShieldCheck, roles: ['admin', 'employee'] },
            ]
        }
    ];

    const sections = allSections.map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(user?.role || 'employee'))
    })).filter(section => section.items.length > 0);

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
                                    end
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
