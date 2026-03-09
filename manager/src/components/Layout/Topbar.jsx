import React from 'react';
import { Menu, Bell, Search, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import manuenLogo from '../../assets/manuen_logo.png';

const Topbar = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="h-[80px] bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
            <div className="flex items-center gap-6">
                <button onClick={toggleSidebar} className="p-2.5 hover:bg-slate-50 rounded-xl lg:hidden text-slate-500 transition-colors">
                    <Menu size={22} />
                </button>
                <div className="hidden md:flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 group focus-within:ring-4 focus-within:ring-[#0B3C5D]/5 transition-all">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search performance..."
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 w-64 text-slate-600 placeholder:text-slate-300"
                    />
                </div>
                <img src={manuenLogo} alt="Logo" className="h-7 hidden sm:block lg:hidden" />
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <button className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-all group">
                    <Bell size={22} className="text-slate-500 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#63C132] rounded-full border-2 border-white animate-pulse"></span>
                </button>

                <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right hidden md:block group-hover:-translate-x-1 transition-transform">
                        <p className="text-sm font-black text-[#0B3C5D]">{user?.name || 'Manager'}</p>
                        <p className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em]">{user?.role || 'Super Manager'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B3C5D] to-[#1A4B6D] p-0.5 shadow-lg shadow-[#0B3C5D]/10 group-hover:rotate-6 transition-all">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-[#0B3C5D] flex items-center justify-center text-white font-black">
                                {user?.name?.charAt(0) || 'M'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
