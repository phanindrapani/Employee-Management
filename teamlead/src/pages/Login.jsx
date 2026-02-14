import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0B3C5D] opacity-[0.03] rounded-full -mr-64 -mt-64 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#63C132] opacity-[0.03] rounded-full -ml-64 -mb-64 blur-3xl"></div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-6 transform hover:rotate-12 transition-transform duration-500 border border-slate-50">
                        <ShieldCheck size={40} className="text-[#63C132]" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-[#0B3C5D] mb-1 italic">
                        TEAM<span className="text-[#63C132]">LEAD</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] ml-1">Management Portal</p>
                </div>

                <div className="bg-white rounded-[40px] shadow-2xl p-12 border border-slate-100 backdrop-blur-sm bg-white/90">
                    <div className="mb-10 flex items-center gap-4">
                        <div className="w-1 h-8 bg-[#63C132] rounded-full"></div>
                        <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight">Lead Sign In</h2>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-xs font-bold mb-8 border border-red-100 flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#0B3C5D] transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:ring-0 focus:border-[#0B3C5D]/10 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300"
                                    placeholder="lead@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#0B3C5D] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-12 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:ring-0 focus:border-[#0B3C5D]/10 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 bg-[#0B3C5D] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#1A4B6D] active:scale-[0.98] transition-all shadow-2xl shadow-[#0B3C5D]/30 border-b-4 border-black/20 mt-4 group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Access Control Center
                                <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
                            </span>
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        Enterprise Resource Architecture 2026
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
