import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-[#0B3C5D] font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-16 text-center border border-slate-100 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>

                <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-10 text-red-500 border-2 border-red-100 shadow-inner relative z-10">
                    <ShieldAlert size={48} className="animate-pulse" />
                </div>

                <h1 className="text-4xl font-black mb-6 tracking-tight text-[#0B3C5D]">Access Restricted</h1>
                <p className="text-slate-500 font-medium mb-12 leading-relaxed text-lg px-4">
                    The management control center is exclusively reserved for <span className="text-[#0B3C5D] font-black">Team Leads</span>. Your current identity does not grant authorization to this portal.
                </p>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-[#0B3C5D] text-white font-black text-xs uppercase tracking-widest rounded-[24px] hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.02] shadow-2xl shadow-[#0B3C5D]/20 border-b-4 border-black/20"
                    >
                        <Lock size={18} />
                        Switch Identity
                    </button>

                    <button
                        onClick={() => window.location.href = 'http://localhost:5173'}
                        className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-white text-[#0B3C5D] font-black text-xs uppercase tracking-widest rounded-[24px] hover:bg-slate-50 transition-all border-2 border-slate-100"
                    >
                        <ArrowLeft size={18} />
                        Return to Employee Portal
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Security Violation Logged</p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
