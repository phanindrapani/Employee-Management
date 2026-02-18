import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api';

const MyProfile = () => {
    const { user, setUser } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            addToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addToast('Image size should be less than 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        setUploading(true);
        try {
            const { data } = await API.put('/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUser(data);
            localStorage.setItem('ls_tl_profile', JSON.stringify(data));
            addToast('Profile picture updated successfully', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            addToast(error.response?.data?.message || 'Failed to update profile picture', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    // Calculate tenure from createdAt
    const calculateTenure = (date) => {
        if (!date) return 'Joining Date N/A';
        const start = new Date(date);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 30) return days <= 1 ? 'New Joiner' : `${days} Day(s)`;

        const months = Math.floor(days / 30.44);
        if (months < 12) return `${months} Month(s)`;

        const years = (days / 365.25).toFixed(1);
        return `${years} Year(s)`;
    };

    if (!user) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Profile Hero */}
            <div className="relative h-48 rounded-[32px] bg-white overflow-hidden shadow-sm border border-slate-100">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#63C132]/5 rounded-full -ml-16 -mb-16"></div>

                <div className="absolute inset-0 p-6 flex items-center">
                    <div className="flex items-center gap-5 relative z-10 w-full">
                        <div className="relative group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <div className="w-24 h-24 bg-slate-100 rounded-[24px] p-1 shadow-md overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 border-2 border-white relative">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover rounded-[22px]" />
                                ) : (
                                    <div className="w-full h-full bg-white flex items-center justify-center text-3xl font-black text-[#0B3C5D]/20">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-[22px]">
                                        <Loader2 size={24} className="text-[#63C132] animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleImageClick}
                                disabled={uploading}
                                className="absolute -bottom-1 -right-1 p-2 bg-[#63C132] text-white rounded-lg shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera size={12} />
                            </button>
                        </div>

                        <div className="text-[#0B3C5D] space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tighter">{user.name}</h1>
                                <span className="px-2 py-0.5 bg-[#63C132] text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-[#63C132]/20">
                                    Lead
                                </span>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
                                <Shield size={12} className="text-[#63C132]" />
                                Authorized Account • {user.role.toUpperCase()}
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
                            Contact Information
                        </h3>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-[#63C132]/10 text-[#63C132] rounded-xl flex items-center justify-center">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">{user.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Location</p>
                                    <p className="text-sm font-bold text-[#0B3C5D]">{user.department?.name || 'Main Office'} • {user.team?.name || 'Core Team'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Access</h3>
                            <Settings size={16} className="text-slate-300" />
                        </div>
                        <Link to="/change-password" title="Change Password" className="w-full flex items-center justify-between p-5 bg-white rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                            <span className="text-sm font-bold text-[#0B3C5D]">Change Password</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Role Level</p>
                                    <p className="text-3xl font-black text-[#0B3C5D]">{user.leadershipLevel || user.experienceLevel || 'Senior'}</p>
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tenure</p>
                                    <p className="text-3xl font-black text-[#0B3C5D]">{calculateTenure(user.createdAt)}</p>
                                </div>
                                <div className="absolute -bottom-4 -right-4 text-[#63C132]/5 group-hover:scale-110 transition-transform">
                                    <Calendar size={120} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-10 bg-white rounded-[40px] border border-slate-100 flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16"></div>

                            <div className="flex-1 space-y-4 relative z-10">
                                <h4 className="text-2xl font-black text-[#0B3C5D] tracking-tight">Management Score</h4>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">Your profile completeness and team performance metrics are used to calculate this score. Maintain complete details for better visibility.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 px-8 py-6 rounded-[32px] border border-slate-100 relative z-10">
                                <CheckCircle2 size={32} className="text-[#63C132]" />
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Score</div>
                                    <div className="text-3xl font-black text-[#0B3C5D]">{user.teamPerformanceScore || user.completeness?.totalScore || 85}%</div>
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
