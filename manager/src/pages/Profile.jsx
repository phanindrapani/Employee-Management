import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, BadgeCheck, Building2, MapPin } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Manager Profile</h1>
                <p className="text-slate-500 font-medium">Manage your personal information and security settings.</p>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-[#0B3C5D] to-[#1A4B6D] relative">
                    <div className="absolute -bottom-16 left-10 p-2 bg-white rounded-[32px] shadow-2xl">
                        <div className="w-32 h-32 rounded-[24px] bg-[#63C132] flex items-center justify-center text-white text-5xl font-black shadow-inner">
                            {user?.name?.charAt(0) || 'M'}
                        </div>
                    </div>
                </div>

                <div className="pt-24 pb-12 px-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-[#0B3C5D]">{user?.name}</h2>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <BadgeCheck size={12} /> Verified Manager
                                </span>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">{user?.role} · {user?.department?.name || user?.department || 'Operations'}</p>
                        </div>
                        <button className="px-8 py-3 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all shadow-xl shadow-[#0B3C5D]/20">
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                        <div className="space-y-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0B3C5D]"><Mail size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                        <p className="text-sm font-black text-[#0B3C5D]">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0B3C5D]"><Building2 size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                                        <p className="text-sm font-black text-[#0B3C5D]">{user?.department?.name || user?.department || 'General Management'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">System Context</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0B3C5D]"><Shield size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Level</p>
                                        <p className="text-sm font-black text-[#0B3C5D]">{user?.role?.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0B3C5D]"><User size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                                        <p className="text-sm font-black text-emerald-500">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
