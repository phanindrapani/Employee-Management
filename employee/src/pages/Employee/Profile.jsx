import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Shield,
    Calendar,
    Award,
    Code,
    Camera,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await API.get('/auth/profile');
                setProfile(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-8 animate-pulse space-y-8">
        <div className="h-32 w-32 bg-slate-200 rounded-full mx-auto"></div>
        <div className="h-10 w-48 bg-slate-200 rounded-lg mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="h-64 bg-white rounded-3xl"></div>
            <div className="h-64 bg-white rounded-3xl"></div>
        </div>
    </div>;

    return (
        <div className="p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Profile Header Card */}
            <div className="relative">
                <div className="h-64 bg-gradient-to-r from-[#0B3C5D] via-[#1A4B6D] to-[#0B3C5D] rounded-[48px] overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#63C132]/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                </div>

                <div className="max-w-5xl mx-auto px-10 -mt-32 relative z-10">
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-44 h-44 rounded-[42px] bg-slate-100 border-8 border-white shadow-xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-[#0B3C5D]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white" size={32} />
                                </div>
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 uppercase text-6xl font-black text-[#0B3C5D]">
                                    {authUser?.name?.charAt(0)}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#63C132] rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <Shield size={20} />
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl font-black text-[#0B3C5D] mb-3 tracking-tight">{profile?.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                                <span className="px-5 py-2 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase size={14} /> {profile?.role}
                                </span>
                                <span className="px-5 py-2 bg-[#63C132]/10 text-[#63C132] rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Award size={14} /> {profile?.experienceLevel} Level
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10 text-slate-500 font-bold text-sm">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-[#0B3C5D]/30" />
                                    {profile?.email}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-[#0B3C5D]/30" />
                                    {profile?.phone || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10">
                        <h3 className="text-xl font-black text-[#0B3C5D] mb-8 flex items-center gap-3">
                            <Code className="text-[#63C132]" />
                            Skills & Expertise
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {profile?.skills?.map((skill, i) => (
                                <div key={i} className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-[#63C132] hover:bg-white transition-all cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-[#63C132] rounded-full"></div>
                                        <span className="text-sm font-black text-[#0B3C5D] uppercase tracking-wider">{skill}</span>
                                    </div>
                                </div>
                            ))}
                            {(!profile?.skills || profile.skills.length === 0) && (
                                <p className="text-slate-400 font-medium italic">No skills added yet.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-10">
                    <section className="bg-[#0B3C5D] rounded-[40px] shadow-2xl p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                        <h3 className="text-xl font-black mb-8 relative z-10 flex items-center gap-3">
                            <Calendar className="text-[#63C132]" />
                            Work Status
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#63C132] mb-1">Joined On</p>
                                <p className="text-sm font-bold">{new Date(profile?.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#63C132] mb-1">Account Status</p>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-[#63C132]" />
                                    <span className="text-sm font-bold">Active Employee</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
