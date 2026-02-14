import React from 'react';
import {
    User,
    Shield,
    Mail,
    Phone,
    MapPin,
    Camera,
    CheckCircle2,
    Briefcase,
    Calendar,
    Settings,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyProfile = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Profile Hero */}
            <div className="relative h-80 rounded-[48px] bg-[#0B3C5D] overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#63C132]/10 rounded-full -ml-32 -mb-32"></div>

                <div className="absolute inset-0 p-12 flex items-end">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="w-40 h-40 bg-white rounded-[40px] p-1 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover rounded-[38px]" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl font-black text-[#0B3C5D]/20">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                )}
                            </div>
                            <button className="absolute bottom-2 right-2 p-3 bg-[#63C132] text-white rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95 border-4 border-white">
                                <Camera size={20} />
                            </button>
                        </div>

                        <div className="text-white space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-5xl font-black tracking-tighter">{user.name}</h1>
                                <span className="px-4 py-1.5 bg-[#63C132] text-[#0B3C5D] text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-black/20">
                                    Lead
                                </span>
                            </div>
                            <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                                <Shield size={16} className="text-[#63C132]" />
                                Operational Authority • Team Lead
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Contact Info */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                        <h3 className="text-lg font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <User size={20} className="text-[#63C132]" />
                            Identity Protocol
                        </h3>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Mail</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-[#63C132]/10 text-[#63C132] rounded-xl flex items-center justify-center">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Line</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">{user.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Hub</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">Regional HQ • Floor 4</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Access</h3>
                            <Settings size={16} className="text-slate-300" />
                        </div>
                        <button className="w-full flex items-center justify-between p-5 bg-white rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                            <span className="text-sm font-bold text-[#0B3C5D]">Revise Access Key</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right: Operational Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight">Lead Performance Summary</h3>
                            <div className="px-4 py-2 bg-[#63C132]/10 text-[#63C132] rounded-xl text-xs font-black uppercase tracking-widest">Q1 Analysis</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-50 rounded-[40px] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-[#0B3C5D] text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#0B3C5D]/20">
                                        <Briefcase size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tenure Grade</p>
                                    <p className="text-3xl font-black text-[#0B3C5D]">{user.experienceLevel || 'Lead'}</p>
                                </div>
                                <div className="absolute -bottom-4 -right-4 text-[#0B3C5D]/5 group-hover:scale-110 transition-transform">
                                    <Briefcase size={120} />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[40px] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-[#63C132] text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#63C132]/20">
                                        <Calendar size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Service Sync</p>
                                    <p className="text-3xl font-black text-[#0B3C5D]">4.2 Years</p>
                                </div>
                                <div className="absolute -bottom-4 -right-4 text-[#63C132]/5 group-hover:scale-110 transition-transform">
                                    <Calendar size={120} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-10 bg-[#0B3C5D] rounded-[40px] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-[#0B3C5D]/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                            <div className="flex-1 space-y-4">
                                <h4 className="text-2xl font-black tracking-tight">Operational Reliability</h4>
                                <p className="text-white/60 text-sm leading-relaxed font-medium">Your leadership has maintained a 98% team output consistency over the last 12 months. Keep up the high standard of management.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 px-8 py-6 rounded-[32px] border border-white/10 backdrop-blur-md">
                                <CheckCircle2 size={32} className="text-[#63C132]" />
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Reliability Score</div>
                                    <div className="text-3xl font-black">98.4</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
