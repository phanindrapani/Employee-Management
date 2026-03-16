import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Camera, Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';


const Profile = () => {
    const { user: authUser, setUser, login } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState(() => {
        const cached = localStorage.getItem('ls_admin_profile');
        return cached ? JSON.parse(cached) : null;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(!profile);
    const [activeTab, setActiveTab] = useState('details');
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        phone: profile?.phone || ''
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.profilePicture || null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await API.get('/auth/profile');
            setProfile(data);
            localStorage.setItem('ls_admin_profile', JSON.stringify(data));
            setFormData({
                name: data.name,
                phone: data.phone || ''
            });
            if (data.profilePicture) {
                setPreviewUrl(data.profilePicture);
            }
        } catch (err) {
            console.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setIsEditing(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);
            if (selectedImage) {
                formDataToSend.append('profilePicture', selectedImage);
            }

            const { data } = await API.put('/auth/profile', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfile(data);
            setUser(data);
            localStorage.setItem('ls_admin_profile', JSON.stringify(data));
            setIsEditing(false);
            setSelectedImage(null);
            showToast('Profile updated successfully', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    return (
        <div className="space-y-8 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
                    <p className="text-slate-500 font-medium">Manage your personal information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="relative mb-6 group">
                            <div className="w-32 h-32 bg-[#0B3C5D] text-white rounded-full flex items-center justify-center text-4xl font-black shadow-xl ring-4 ring-white overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profile?.name?.charAt(0) || '?'
                                )}
                            </div>
                            <label htmlFor="profile-upload" className="absolute bottom-0 right-0 p-2 bg-[#63C132] text-white rounded-full shadow-lg hover:bg-[#52A428] transition-all cursor-pointer">
                                <Camera size={16} />
                                <input
                                    type="file"
                                    id="profile-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                        <h2 className="text-2xl font-black text-[#0B3C5D] mb-1">{profile?.name || '...'}</h2>
                        <span className="px-3 py-1 bg-[#F0F7FF] text-[#0B3C5D] rounded-full text-xs font-black uppercase tracking-widest border border-[#0B3C5D]/10">
                            {profile?.role || '...'}
                        </span>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-slate-100/80 rounded-xl w-fit">
                        <div className="px-6 py-2.5 bg-white text-[#0B3C5D] rounded-lg text-sm font-bold shadow-sm">
                            Personal Details
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400 italic">
                                Loading Profile Details...
                            </div>
                        ) : !profile ? (
                            <div className="text-center py-10 text-slate-400">Profile not found</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-[#0B3C5D]">Personal Details</h3>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-[#F0F7FF] text-[#0B3C5D] rounded-xl text-sm font-bold hover:bg-[#E0F0FF] transition-all"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                            <div className="relative group">
                                                <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-[#0B3C5D]' : 'text-slate-400'}`} />
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 font-bold transition-all outline-none
                                            ${isEditing
                                                            ? 'bg-white border-[#0B3C5D]/20 focus:border-[#0B3C5D] focus:ring-4 focus:ring-[#0B3C5D]/5 text-[#0B3C5D] shadow-sm'
                                                            : 'bg-slate-50 border-transparent text-slate-600'
                                                        }`}
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="email"
                                                    disabled
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-transparent bg-slate-50 text-slate-500 font-bold opacity-70 cursor-not-allowed"
                                                    value={profile.email}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                            <div className="relative">
                                                <Phone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-[#0B3C5D]' : 'text-slate-400'}`} />
                                                <input
                                                    type="tel"
                                                    disabled={!isEditing}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 font-bold transition-all outline-none
                                            ${isEditing
                                                            ? 'bg-white border-[#0B3C5D]/20 focus:border-[#0B3C5D] focus:ring-4 focus:ring-[#0B3C5D]/5 text-[#0B3C5D] shadow-sm'
                                                            : 'bg-slate-50 border-transparent text-slate-600'
                                                        }`}
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="Not set"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                                            <div className="relative">
                                                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    disabled
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-transparent bg-slate-50 text-slate-500 font-bold opacity-70 cursor-not-allowed capitalize"
                                                    value={profile.role}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 animation-fade-in">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({ name: profile.name, phone: profile.phone || '' });
                                                    setSelectedImage(null);
                                                    setPreviewUrl(profile.profilePicture);
                                                }}
                                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-all flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <Save size={18} /> Save Changes
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
