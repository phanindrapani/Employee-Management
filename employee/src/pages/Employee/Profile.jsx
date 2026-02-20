import { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    Briefcase,
    Shield,
    Calendar,
    Award,
    Code,
    Camera,
    CheckCircle2,
    Activity,
    Target,
    Users2,
    Settings2,
    GraduationCap,
    MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

const Profile = () => {
    const { user: authUser, setUser, refreshProfile } = useAuth();
    const [profile, setProfile] = useState(() => {
        const cached = localStorage.getItem('ls_emp_profile');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!profile);
    const [uploading, setUploading] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioContent, setBioContent] = useState('');
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [skillsContent, setSkillsContent] = useState('');
    const [isEditingEdu, setIsEditingEdu] = useState(false);
    const [eduContent, setEduContent] = useState('');
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneContent, setPhoneContent] = useState('');

    useEffect(() => {
        if (profile?.bio) setBioContent(profile.bio);
        if (profile?.skills) setSkillsContent(profile.skills.join(', '));
        if (profile?.qualification) setEduContent(profile.qualification);
        if (profile?.phone) setPhoneContent(profile.phone);
    }, [profile]);

    const handleSave = async (field, value) => {
        try {
            const payload = field === 'skills' ? { skills: value.split(',').map(s => s.trim()).filter(s => s !== '') } : { [field]: value };
            const { data } = await API.put('/auth/profile', payload);
            setProfile(prev => ({ ...prev, ...payload, completeness: data.completeness }));
            if (field === 'bio') setIsEditingBio(false);
            if (field === 'skills') setIsEditingSkills(false);
            if (field === 'qualification') setIsEditingEdu(false);
            if (field === 'phone') setIsEditingPhone(false);

            // Update cache
            localStorage.setItem('ls_emp_profile', JSON.stringify({ ...profile, ...payload, completeness: data.completeness }));
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            alert(`Failed to update ${field}.`);
        }
    };

    const handleBioSave = () => handleSave('bio', bioContent);
    const handleSkillsSave = () => handleSave('skills', skillsContent);
    const handleEduSave = () => handleSave('qualification', eduContent);
    const handlePhoneSave = () => handleSave('phone', phoneContent);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const data = await refreshProfile();
                if (data) setProfile(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [refreshProfile]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        setUploading(true);
        try {
            const { data } = await API.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update profile with new image (backend returns updated user object)
            setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
            setUser(data);
            localStorage.setItem('ls_emp_profile', JSON.stringify(data));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="p-8 animate-pulse space-y-12">
            <div className="h-64 bg-slate-100 rounded-[48px]"></div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 -mt-32">
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-48 bg-white rounded-[40px]"></div>
                    <div className="h-64 bg-white rounded-[40px]"></div>
                </div>
                <div className="space-y-8">
                    <div className="h-80 bg-white rounded-[40px]"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Profile Card Section */}
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-10 flex flex-col md:flex-row items-center gap-10">
                    {/* Avatar Section */}
                    <div className="relative group">
                        <div className="w-48 h-48 rounded-[48px] bg-slate-100 border-8 border-white shadow-2xl overflow-hidden relative transform group-hover:scale-105 transition-all duration-500">
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <div className="w-8 h-8 border-4 border-[#0B3C5D] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : profile?.profilePicture ? (
                                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-7xl font-black text-[#0B3C5D] uppercase">
                                    {profile?.name?.charAt(0)}
                                </div>
                            )}

                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-[#0B3C5D]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-10">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Camera className="text-white" size={32} />
                            </label>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-[#63C132] rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-xl animate-bounce-subtle z-20">
                            <Shield size={24} />
                        </div>
                    </div>

                    {/* Identity Section */}
                    <div className="text-center md:text-left flex-1 space-y-4">
                        <div>
                            <h1 className="text-5xl font-black text-[#0B3C5D] tracking-tight mb-2">{profile?.name}</h1>
                            <p className="text-[#63C132] font-black uppercase tracking-[0.3em] text-xs">
                                Member ID: {profile?._id?.slice(-8).toUpperCase()}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-5 py-2 bg-[#0B3C5D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#0B3C5D]/20">
                                <Briefcase size={14} className="text-[#63C132]" /> {profile?.role}
                            </span>
                            <span className="px-5 py-2 bg-white text-[#0B3C5D] border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                <Award size={14} className="text-[#63C132]" /> {(profile?.experienceLevel || profile?.leadershipLevel) || 'Standard'} {profile?.leadershipLevel ? 'Seniority' : 'Experience'}
                            </span>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                    <Mail size={16} className="text-[#0B3C5D]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Email Address</p>
                                    <p className="text-xs font-bold text-[#0B3C5D]">{profile?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group/phone">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                    <Phone size={16} className="text-[#0B3C5D]" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Phone Number</p>
                                    {isEditingPhone ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={phoneContent}
                                                onChange={(e) => setPhoneContent(e.target.value)}
                                                className="text-xs font-bold text-[#0B3C5D] border-b border-slate-200 focus:border-[#63C132] outline-none bg-transparent w-24"
                                            />
                                            <button onClick={handlePhoneSave} className="text-[#63C132] font-black text-[9px] uppercase">Save</button>
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-[#0B3C5D] flex items-center gap-2">
                                            {profile?.phone || 'Not provided'}
                                            <button onClick={() => setIsEditingPhone(true)} className="opacity-0 group-hover/phone:opacity-100 text-slate-400 hover:text-[#0B3C5D] transition-opacity">
                                                <Settings2 size={12} />
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column (Main Info) */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Professional Bio */}
                    <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-[#63C132]/5 transition-colors"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#0B3C5D] flex items-center gap-3 relative z-10">
                                <Activity className="text-[#63C132]" /> Professional Summary
                            </h3>
                            {isEditingBio ? (
                                <div className="flex gap-2 relative z-20">
                                    <button
                                        onClick={() => setIsEditingBio(false)}
                                        className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBioSave}
                                        className="px-4 py-1.5 bg-[#63C132] text-white text-[10px] font-black uppercase rounded-full hover:bg-[#52a129] transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingBio(true)}
                                    className="px-4 py-1.5 bg-blue-50 text-[#0B3C5D] text-[10px] font-black uppercase rounded-full hover:bg-blue-100 transition-colors relative z-20"
                                >
                                    Edit Summary
                                </button>
                            )}
                        </div>
                        {isEditingBio ? (
                            <textarea
                                value={bioContent}
                                onChange={(e) => setBioContent(e.target.value)}
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#63C132] focus:border-transparent outline-none text-slate-600 font-medium resize-none relative z-10"
                                placeholder="Describe your professional journey, skills, and goals..."
                            />
                        ) : (
                            <p className="text-slate-500 font-medium leading-relaxed relative z-10">
                                {profile?.bio || `Dedicated ${profile?.role} at Corporate ERP, focused on ${profile?.skills?.slice(0, 3).join(', ') || 'delivering high-quality solutions'}. Committed to operational excellence and team collaboration.`}
                            </p>
                        )}
                    </section>

                    {/* Skills Grid */}
                    <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-[#0B3C5D] flex items-center gap-3">
                                <Code className="text-[#63C132]" /> Technical Skills
                            </h3>
                            <div className="flex items-center gap-3 relative z-20">
                                {isEditingSkills ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditingSkills(false)}
                                            className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSkillsSave}
                                            className="px-4 py-1.5 bg-[#63C132] text-white text-[10px] font-black uppercase rounded-full"
                                        >
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingSkills(true)}
                                        className="px-4 py-1.5 bg-blue-50 text-[#0B3C5D] text-[10px] font-black uppercase rounded-full hover:bg-blue-100 transition-colors"
                                    >
                                        Edit Skills
                                    </button>
                                )}
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                    {profile?.skills?.length || 0} Specializations
                                </span>
                            </div>
                        </div>

                        {isEditingSkills ? (
                            <input
                                type="text"
                                value={skillsContent}
                                onChange={(e) => setSkillsContent(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#63C132] outline-none text-slate-600 font-medium mb-6"
                                placeholder="Enter skills separated by commas (e.g. React, Node, SQL)..."
                            />
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {profile?.skills?.map((skill, i) => (
                                    <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:bg-[#0B3C5D] transition-all duration-300">
                                        <div className="w-2 h-2 bg-[#63C132] rounded-full group-hover:scale-150 transition-transform"></div>
                                        <span className="text-[10px] font-black text-[#0B3C5D] group-hover:text-white uppercase tracking-widest">{skill}</span>
                                    </div>
                                ))}
                                {(!profile?.skills || profile.skills.length === 0) && (
                                    <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest">No technical skills indexed</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Job Relationship Bridge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#F8FAFC] p-8 rounded-[40px] border border-slate-100 flex flex-col items-center text-center space-y-4 group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#63C132] transition-all duration-500 group-hover:rotate-12">
                                <Target className="text-[#63C132] group-hover:text-white" size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                <h4 className="text-lg font-black text-[#0B3C5D]">{profile?.department?.name || 'Unassigned'}</h4>
                            </div>
                        </div>
                        <div className="bg-[#F8FAFC] p-8 rounded-[40px] border border-slate-100 flex flex-col items-center text-center space-y-4 group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#0B3C5D] transition-all duration-500 group-hover:-rotate-12">
                                <Users2 className="text-[#0B3C5D] group-hover:text-white" size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Team</p>
                                <h4 className="text-lg font-black text-[#0B3C5D]">{profile?.team?.name || 'Independent Contributor'}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Side Info) */}
                <div className="space-y-10">
                    {/* Performance Score Card */}
                    <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#0B3C5D] flex items-center gap-3">
                                <Activity className="text-[#63C132]" /> Trust Index
                            </h3>
                            <div className="px-3 py-1 bg-blue-50 text-[#0B3C5D] rounded-lg text-[9px] font-black uppercase tracking-widest">
                                Live Score
                            </div>
                        </div>
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="w-16 h-16 bg-[#0B3C5D] rounded-2xl flex items-center justify-center text-[#63C132] shadow-lg">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-[#0B3C5D]">{profile?.individualPerformanceScore || profile?.teamPerformanceScore || 0}</span>
                                    <span className="text-sm font-black text-slate-400">%</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-6 text-[10px] text-slate-500 font-medium italic leading-relaxed text-center">
                            Calculated based on task completion, on-time delivery, and attendance.
                        </p>
                    </section>

                    {/* Work Status Card */}
                    <section className="bg-[#0B3C5D] rounded-[48px] shadow-2xl p-10 text-white relative overflow-hidden group">
                        {/* Interactive Background Shape */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125"></div>

                        <h3 className="text-xl font-black mb-10 flex items-center gap-3 relative z-10">
                            <Settings2 className="text-[#63C132]" /> <span style={{ color: 'white' }}>System Status</span>
                        </h3>

                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                                    <Calendar className="text-[#63C132]" size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em] mb-1">Company Onboarding</p>
                                    <p className="text-sm font-bold text-white">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Joining Date...'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                                    <CheckCircle2 size={24} className="text-[#63C132]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em] mb-1">Verification Status</p>
                                    <p className="text-sm font-bold text-white">Verified Employee</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#63C132]">
                                    <span>Security & Health</span>
                                    <div className="flex gap-2 text-slate-400">
                                        <span title="Essential Info">E: {profile?.completeness?.breakdown?.essential || 0}</span>
                                        <span title="Professional Details">P: {profile?.completeness?.breakdown?.professional || 0}</span>
                                        <span title="Security signals">S: {profile?.completeness?.breakdown?.security || 0}</span>
                                        <span className="text-[#63C132] ml-1">{profile?.completeness?.totalScore || 0}%</span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#63C132] rounded-full shadow-[0_0_10px_#63C132] transition-all duration-1000" style={{ width: `${profile?.completeness?.totalScore || 0}%` }}></div>
                                </div>
                                <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest text-center mt-2">
                                    Update bio, skills, qualification & phone to reach 100%
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Professional Qualifications */}
                    <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 hover:shadow-xl transition-all duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-[#0B3C5D] flex items-center gap-3">
                                <GraduationCap className="text-[#63C132]" /> Education
                            </h3>
                            {isEditingEdu ? (
                                <div className="flex gap-2 relative z-20">
                                    <button
                                        onClick={() => setIsEditingEdu(false)}
                                        className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEduSave}
                                        className="px-4 py-1.5 bg-[#63C132] text-white text-[10px] font-black uppercase rounded-full"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingEdu(true)}
                                    className="px-4 py-1.5 bg-blue-50 text-[#0B3C5D] text-[10px] font-black uppercase rounded-full hover:bg-blue-100 transition-colors relative z-20"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="pl-6 border-l-4 border-[#F8FAFC] group-hover:border-[#63C132] transition-colors">
                                <h4 className="text-sm font-black text-[#0B3C5D] uppercase tracking-wider mb-1">Primary Qualification</h4>
                                {isEditingEdu ? (
                                    <input
                                        type="text"
                                        value={eduContent}
                                        onChange={(e) => setEduContent(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#63C132] outline-none text-slate-600 font-medium text-xs mt-2"
                                        placeholder="e.g. B.Tech in Computer Science"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-500 font-medium italic">
                                        {profile?.qualification || 'Highest degree not specified on record.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Reporting Manager Bridge */}
                    {profile?.reportingManager && (
                        <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all duration-500">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Direct Supervisor</p>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="w-12 h-12 rounded-xl bg-[#0B3C5D] flex items-center justify-center text-white font-black text-xl shadow-lg">
                                    {profile.reportingManager.profilePicture ? (
                                        <img src={profile.reportingManager.profilePicture} alt={profile.reportingManager.name} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        profile.reportingManager.name.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-[#0B3C5D] truncate">{profile.reportingManager.name}</h4>
                                    <p className="text-[10px] font-bold text-[#63C132] uppercase tracking-tighter">Reporting Manager</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <MessageCircle size={14} className="text-[#0B3C5D]" />
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
