import React, { useState } from 'react';
import API from '../api';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F0F7FF] text-[#0B3C5D] rounded-lg">
                    <KeyRound size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0B3C5D]">Security</h1>
                    <p className="text-slate-500 text-sm">Change your password</p>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="card shadow-sm border-none bg-white p-8">
                    <h3 className="text-lg font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-[#63C132]" />
                        Update Password
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                            <input
                                type="password"
                                className="input-field w-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                            <input
                                type="password"
                                className="input-field w-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Min 6 characters"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                            <input
                                type="password"
                                className="input-field w-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Repeat new password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 italic font-medium">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-4 rounded-xl border border-green-100 font-bold">
                                <ShieldCheck size={16} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                        <div className="text-xs text-amber-700 font-medium leading-relaxed">
                            <strong>Note:</strong> Changing your password will not affect your current session, but you will need to use your new credentials next time.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
