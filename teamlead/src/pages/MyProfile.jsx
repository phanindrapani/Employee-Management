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
    Loader2,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api';

const MyProfile = () => {
    const { user, setUser } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [teamAvgScore, setTeamAvgScore] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Fetch team members and calculate average performance score
    useEffect(() => {
        const fetchTeamAverage = async () => {
            try {
                const { data: responseData } = await API.get('/team-lead/team');
                const members = responseData.members || responseData;
                if (Array.isArray(members) && members.length > 0) {
                    const validScores = members
                        .map(m => m.individualPerformanceScore || 0)
                        .filter(score => score > 0);
                    const avg = validScores.length > 0
                        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                        : 0;
                    setTeamAvgScore(avg);
                }
                // Also trigger backend calculation to sync the score
                try {
                    await API.post('/team-lead/team/calculate-score');
                } catch (err) {
                    console.log('Score sync:', err);
                }
            } catch (error) {
                console.error('Error fetching team average:', error);
            }
        };
        fetchTeamAverage();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

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

    const calculateTenure = (date) => {
        if (!date) return 'Join Date N/A';
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

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Profile Hero */}
            <div className="relative min-h-[160px] md:h-48 rounded-[24px] md:rounded-[32px] bg-white overflow-hidden shadow-sm border border-slate-100 flex items-center">
                <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-slate-50 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24"></div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6 relative z-10 w-full">
                    <div className="relative group shrink-0">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-[20px] md:rounded-[24px] p-1 shadow-md overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 border-2 border-white relative">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover rounded-[18px] md:rounded-[22px]" />
                            ) : (
                                <div className="w-full h-full bg-white flex items-center justify-center text-2xl md:text-3xl font-black text-[#0B3C5D]/20">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-[18px] md:rounded-[22px]">
                                    <Loader2 size={24} className="text-[#63C132] animate-spin" />
                                </div>
                            )}
                        </div>
                        <button onClick={handleImageClick} disabled={uploading} className="absolute -bottom-1 -right-1 p-2 bg-[#63C132] text-white rounded-lg shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-white disabled:opacity-50">
                            <Camera size={12} />
                        </button>
                    </div>

                    <div className="text-center md:text-left text-[#0B3C5D] space-y-1 md:space-y-0.5">
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-black tracking-tight">{user.name}</h1>
                            <span className="px-2 py-0.5 bg-[#63C132] text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-md">
                                {user.role?.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[9px] flex items-center justify-center md:justify-start gap-2">
                            <Shield size={10} className="text-[#63C132]" />
                            Authorized Portal Access
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left: Contact Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                        <h3 className="text-lg font-black text-[#0B3C5D] tracking-tight flex items-center gap-3 leading-none">
                            <User size={20} className="text-[#63C132]" />
                            Information
                        </h3>

                        <div className="space-y-4">
                            {[
                                { label: 'Email Address', val: user.email, ico: Mail, clr: 'blue' },
                                { label: 'Phone Number', val: user.phone || 'Not Shared', ico: Phone, clr: '[#63C132]' },
                                { label: 'Team Context', val: `${user.department?.name || 'HR'} • ${user.team?.name || 'Core'}`, ico: MapPin, clr: 'amber' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[20px] group transition-all">
                                    <div className={`w-10 h-10 bg-${item.clr}-50 text-${item.clr}-500 rounded-xl flex items-center justify-center shrink-0`}>
                                        <item.ico size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-bold text-[#0B3C5D] truncate">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black !text-slate-400 uppercase tracking-[0.2em]">Security Settings</h3>
                            <Settings size={16} className="text-slate-300" />
                        </div>
                        <Link to="/change-password" title="Change Password" className="w-full flex items-center justify-between p-4 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all group">
                            <span className="text-sm font-bold text-[#0B3C5D]">Update Password</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Right: Operational Stats */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
                            <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight">Performance Summary</h3>
                            <div className="px-3 py-1 bg-[#63C132]/10 text-[#63C132] rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">Active Analysis</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                            <div className="p-6 md:p-8 bg-slate-50 rounded-[32px] md:rounded-[40px] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0B3C5D] text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-md">
                                        <Briefcase className="size-5 md:size-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Impact Level</p>
                                    <p className="text-2xl md:text-3xl font-black text-[#0B3C5D]">{user.leadershipLevel || user.experienceLevel || 'Mid-Lead'}</p>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-slate-50 rounded-[32px] md:rounded-[40px] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#63C132] text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-md">
                                        <Calendar className="size-5 md:size-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tenure</p>
                                    <p className="text-2xl md:text-3xl font-black text-[#0B3C5D]">{calculateTenure(user.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-10">
                            <div className="p-6 md:p-8 bg-slate-50 rounded-[32px] md:rounded-[40px] flex flex-col md:flex-row items-center gap-6 shadow-sm group hover:shadow-md transition-all">
                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <h4 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight">Individual Compliance</h4>
                                    <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">Personal score based on your tasks and attendance.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white px-5 py-3 md:px-6 md:py-4 rounded-[20px] md:rounded-[24px] shrink-0 shadow-sm">
                                    <CheckCircle2 className="text-[#63C132] size-5 md:size-6" />
                                    <div>
                                        <div className="text-[8px] md:text-[8px] font-black uppercase tracking-widest text-slate-400">My Score</div>
                                        <div className="text-xl md:text-2xl font-black text-[#0B3C5D]">{user.individualPerformanceScore || 0}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-slate-50 rounded-[32px] md:rounded-[40px] flex flex-col md:flex-row items-center gap-6 shadow-sm group hover:shadow-md transition-all">
                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <h4 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight">Team Trust Index</h4>
                                    <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">Aggregated performance of your direct reports.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white px-5 py-3 md:px-6 md:py-4 rounded-[20px] md:rounded-[24px] shrink-0 shadow-sm">
                                    <Users className="text-[#63C132] size-5 md:size-6" />
                                    <div>
                                        <div className="text-[8px] md:text-[8px] font-black uppercase tracking-widest text-[#63C132]">Team Avg</div>
                                        <div className="text-xl md:text-2xl font-black text-[#0B3C5D]">{teamAvgScore !== null ? `${teamAvgScore}%` : 'Calculating...'}</div>
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

export default MyProfile;
