import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    User,
    LogOut,
    Settings,
    X,
    ChevronRight,
    Lock,
    Briefcase,
    CheckSquare,
    Clock,
    CalendarDays,
    Ticket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import manuenSquare from '../../assets/manuen_square.png';

const Sidebar = ({ isOpen, toggle }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const sections = [
        {
            title: 'CORE',
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
            ]
        },
        {
            title: 'STRATEGIC MANAGEMENT',
            items: [
                { name: 'Projects', path: '/projects', icon: Briefcase },
                { name: 'Tasks Overview', path: '/tasks', icon: CheckSquare },
                { name: 'Team Performance', path: '/team-performance', icon: BarChart3 },
            ]
        },
        {
            title: 'OPERATIONS',
            items: [
                { name: 'Work Logs', path: '/work-logs', icon: Clock },
                { name: 'Leave Oversight', path: '/leaves', icon: CalendarDays },
                { name: 'Tickets', path: '/tickets', icon: Ticket },
            ]
        },
        {
            title: 'PERSONAL',
            items: [
                { name: 'My Profile', path: '/profile', icon: User },
                { name: 'Security', path: '/change-password', icon: Lock },
            ]
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`
            fixed lg:sticky top-0 left-0 z-50 w-64 bg-[#0B3C5D] text-white h-screen flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            {/* Header / Logo */}
            <div className="p-8 border-b border-[#1A4B6D]/50 flex flex-col items-center gap-2 relative bg-[#0B3C5D]">
                <button onClick={toggle} className="lg:hidden absolute top-4 right-4 text-gray-300 hover:text-white p-1">
                    <X size={20} />
                </button>
                <span className="text-xl font-black tracking-tighter text-[#63C132] text-center italic">MANAGER<span>PORTAL</span></span>
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
                                    end={item.path === '/'}
                                    onClick={() => toggle && window.innerWidth < 1024 && toggle()}
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
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-[#1A4B6D]">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#63C132] flex items-center justify-center font-black text-white text-xs">
                            {user?.name?.charAt(0) || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">{user?.name || 'Manager'}</p>
                            <p className="text-[8px] font-bold text-slate-400 truncate uppercase tracking-widest">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors font-semibold text-sm"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
