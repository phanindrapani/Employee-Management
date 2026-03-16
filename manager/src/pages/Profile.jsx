import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, BadgeCheck, Building2, Phone, Camera, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API from '../api';

const Profile = () => {
    const { user, checkAuth } = useAuth();
    const { showToast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        try {
            await API.put('/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await checkAuth(); // Refresh user context
            setSelectedFile(null);
            setPreviewUrl(null);
            showToast('Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Upload failed', error);
            showToast('Failed to upload profile picture', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[#0B3C5D]">My Profile</h1>
                    <p className="text-slate-500 font-medium mt-1">View and manage your personal details.</p>
                </div>
                {selectedFile && (
                    <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-6 py-3 bg-[#63C132] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            Save New Photo
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={uploading}
                            className="px-6 py-3 bg-white text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="card p-0 overflow-hidden border-none shadow-2xl shadow-[#0B3C5D]/5">
                <div className="h-56 bg-gradient-to-br from-[#0B3C5D] via-[#1A4B6D] to-[#0B3C5D] relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -bottom-20 left-12 p-3 bg-white rounded-[40px] shadow-2xl group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-40 h-40 rounded-[32px] overflow-hidden bg-[#F8FAFC] flex items-center justify-center text-[#0B3C5D] text-6xl font-black relative">
                            {previewUrl || user?.profilePicture ? (
                                <img src={previewUrl || user?.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'M'
                            )}

                            <div className="absolute inset-0 bg-[#0B3C5D]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Camera size={32} className="text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="pt-28 pb-16 px-12">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-12 border-b border-slate-50">
                        <div>
                            <div className="flex items-center gap-4">
                                <h2 className="text-4xl font-black text-[#0B3C5D] tracking-tight">{user?.name}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-emerald-100/50">
                                        <BadgeCheck size={14} /> Verified Manager
                                    </span>
                                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-indigo-100/50">
                                        ID: {user?.uid || 'MGR-XXXX'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="px-3 py-1 bg-[#F0F7FF] rounded-lg border border-blue-50">
                                    <p className="text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest">{user?.role}</p>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.department?.name || user?.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16">
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Contact Details</h3>
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0B3C5D] border border-slate-50 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                            <Mail size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                                            <p className="font-black text-[#0B3C5D] tracking-tight">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0B3C5D] border border-slate-50 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                            <Phone size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile Number</p>
                                            <p className="font-black text-[#0B3C5D] tracking-tight">{user?.phone || '+91 0000 0000 00'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0B3C5D] border border-slate-50 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                            <Building2 size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                            <p className="font-black text-[#0B3C5D] tracking-tight">{user?.department?.name || user?.department}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Job Details</h3>
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0B3C5D] border border-slate-50 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                            <Shield size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                                            <p className="font-black text-[#0B3C5D] uppercase tracking-widest">{user?.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0B3C5D] border border-slate-50 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                            <User size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Manager</p>
                                            <p className="font-black text-[#0B3C5D] tracking-tight">
                                                {user?.reportingManager?.name || (user?.role === 'manager' ? 'Admin' : 'Not Assigned')}
                                            </p>
                                        </div>
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
