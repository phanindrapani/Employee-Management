import React, { useState } from 'react';
import API from '../api';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match');
            return;
        }

        try {
            setLoading(true);
            await API.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                        <KeyRound size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Security</h1>
                        <p className="text-slate-500 font-medium italic">Update your account password</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 bg-white rounded-[32px] shadow-sm border border-slate-50 p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 italic">
                                <ShieldAlert size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-[#F0FFF4] text-[#63C132] p-4 rounded-2xl text-xs font-bold border border-[#63C132]/10 flex items-center gap-3">
                                <ShieldCheck size={18} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1A4B6D] active:scale-95 transition-all shadow-xl shadow-[#0B3C5D]/20 mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0B3C5D] rounded-[32px] p-8 text-white shadow-xl shadow-[#0B3C5D]/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#63C132]/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-[#63C132]" />
                                Security Tips
                            </h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm text-blue-100/80 font-medium">
                                    <div className="w-1.5 h-1.5 bg-[#63C132] rounded-full mt-1.5 shrink-0"></div>
                                    Use at least 8 characters with a mix of letters, numbers, and symbols.
                                </li>
                                <li className="flex gap-3 text-sm text-blue-100/80 font-medium">
                                    <div className="w-1.5 h-1.5 bg-[#63C132] rounded-full mt-1.5 shrink-0"></div>
                                    Avoid using common words or personal information.
                                </li>
                                <li className="flex gap-3 text-sm text-blue-100/80 font-medium">
                                    <div className="w-1.5 h-1.5 bg-[#63C132] rounded-full mt-1.5 shrink-0"></div>
                                    Change your password every 90 days for better security.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
