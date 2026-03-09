import React, { useState } from 'react';
import API from '../api';
import { useToast } from '../context/ToastContext';
import { Lock, ShieldCheck, AlertCircle, Save } from 'lucide-react';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            await API.put('/auth/change-password', {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            showToast('Password updated successfully', 'success');
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to change password', 'error');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Security</h1>
                <p className="text-slate-500 font-medium">Update your security credentials for the manager portal.</p>
            </div>

            <div className="card p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-blue-50 text-[#0B3C5D] rounded-3xl flex items-center justify-center shadow-inner">
                        <Lock size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#0B3C5D]">Update Password</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Last changed 3 months ago</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Key</label>
                        <input
                            type="password"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                            placeholder="Enter current password"
                            value={formData.oldPassword}
                            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Key</label>
                            <input
                                type="password"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="Min 8 characters"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Key</label>
                            <input
                                type="password"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-700"
                                placeholder="Repeat new password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <ShieldCheck size={20} className="text-[#0B3C5D] shrink-0" />
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                            Changing your password will update your access across all Manuen services. Ensure you use a strong, unique key combining letters, numbers, and symbols.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-5 bg-[#0B3C5D] text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#1A4B6D] active:scale-[0.98] transition-all shadow-2xl shadow-[#0B3C5D]/20 flex items-center justify-center gap-3"
                    >
                        <Save size={18} />
                        Save Security Portals
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
