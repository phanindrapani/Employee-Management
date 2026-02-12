import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import manuenSquare from '../assets/manuen_square.png';
import manuenLogo from '../assets/manuen_logo.png';

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
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0B3C5D] opacity-[0.03] rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#63C132] opacity-[0.03] rounded-full -ml-48 -mb-48 blur-3xl"></div>

            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src={manuenSquare} alt="Manuen" className="w-20 h-20 drop-shadow-2xl animate-pulse" />
                    </div>
                    <div className="flex justify-center mb-2">
                        <img src={manuenLogo} alt="Manuen Employee" className="h-10" />
                    </div>
                    <p className="text-slate-500 font-medium">Employee Leave Management</p>
                </div>

                <div className="bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100 relative z-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-xl font-bold text-[#0B3C5D]">Employee Login</h2>
                        <div className="h-1 w-12 bg-[#63C132] rounded-full mx-auto mt-2"></div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-8 border border-red-100 flex items-center gap-2 italic">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="employee@manuen.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1A4B6D] active:scale-95 transition-all shadow-xl shadow-[#0B3C5D]/20 mt-4"
                        >
                            Sign In
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-center text-slate-400 text-xs font-bold uppercase tracking-tighter">
                    © 2026 Manuen Infotech • Employee Portal
                </p>
            </div>
        </div>
    );
};

export default Login;
