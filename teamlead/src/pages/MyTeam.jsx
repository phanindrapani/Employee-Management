import React, { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    Briefcase,
    Activity,
    CalendarCheck,
    MoreHorizontal
} from 'lucide-react';
import API from '../api';

import { useNavigate } from 'react-router-dom';

const MyTeam = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(() => {
        const cached = localStorage.getItem('ls_tl_team_members');
        return cached ? JSON.parse(cached) : {
            members: [],
            metadata: { teamName: 'My Team', departmentName: 'Human Resources' }
        };
    });
    const [loading, setLoading] = useState(!data.members || data.members.length === 0);
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const { data: responseData } = await API.get('/team-lead/team');
                // Support both old array and new object format for transition
                const formattedData = responseData.members ? responseData : {
                    members: responseData,
                    metadata: { teamName: 'My Team', departmentName: 'Human Resources' }
                };
                setData(formattedData);
                localStorage.setItem('ls_tl_team_members', JSON.stringify(formattedData));
                setLoading(false);
            } catch (error) {
                console.error("Fetch team members error:", error);
                setLoading(false);
            }
        };
        fetchTeamMembers();
    }, []);

    // Click away to close menu
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) return <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-[32px] shadow-sm"></div>)}
    </div>;

    const { members, metadata } = data;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">
                        {metadata.teamName}
                    </h1>
                    <p className="text-slate-500 font-medium bg-slate-100/50 px-4 py-1.5 rounded-full inline-block text-xs uppercase tracking-[0.2em] border border-slate-100">
                        {metadata.departmentName} • Performance & Workload Monitoring
                    </p>
                </div>
                <div className="px-6 py-3 bg-[#63C132]/10 text-[#63C132] rounded-full text-xs font-black uppercase tracking-widest border border-[#63C132]/20">
                    {members.length} Active Members
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {members.map((member, idx) => (
                    <div key={member._id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                        {/* Member Header */}
                        <div className="p-8 pb-4 relative">
                            <div className="absolute top-8 right-8 z-20">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === idx ? null : idx);
                                    }}
                                    className={`p-2 rounded-xl transition-all ${activeMenu === idx ? 'bg-[#0B3C5D] text-white' : 'text-slate-300 hover:text-[#0B3C5D] hover:bg-slate-50'}`}
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                {activeMenu === idx && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-2">
                                        <button
                                            onClick={() => navigate(`/tasks`)}
                                            className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B3C5D] flex items-center gap-3 transition-colors"
                                        >
                                            <Briefcase size={14} className="text-blue-500" />
                                            Assign Task
                                        </button>
                                        <button
                                            onClick={() => navigate(`/reports`)}
                                            className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#63C132] flex items-center gap-3 transition-colors"
                                        >
                                            <Activity size={14} className="text-[#63C132]" />
                                            View Performance
                                        </button>
                                        <div className="h-px bg-slate-100 my-1 mx-4"></div>
                                        <button
                                            onClick={() => window.open(`mailto:${member.email}`)}
                                            className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-500 flex items-center gap-3 transition-colors"
                                        >
                                            <Mail size={14} className="text-rose-400" />
                                            Email Member
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                                        {member.profilePicture ? (
                                            <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#0B3C5D]/20">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full ${member.isActive ? 'bg-[#63C132]' : 'bg-slate-300'}`}></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight">{member.name}</h3>
                                        {member.isOnLeave && (
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100">
                                                On Leave Today
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="text-[10px] font-black text-[#63C132] uppercase tracking-widest bg-[#63C132]/10 px-2 py-0.5 rounded-md">
                                            {member.experienceLevel || 'Junior'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Member Body */}
                        <div className="px-8 py-4 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl">
                                <Mail size={16} className="text-blue-500" />
                                {member.email}
                            </div>

                            {/* Skills Tags */}
                            <div className="flex flex-wrap gap-2">
                                {member.skills && member.skills.length > 0 ? (
                                    member.skills.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="text-[9px] font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg uppercase tracking-tight">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[9px] font-bold text-slate-300 px-3 py-1 border border-dashed border-slate-200 rounded-lg uppercase">
                                        No Skills Listed
                                    </span>
                                )}
                                {member.skills?.length > 3 && (
                                    <span className="text-[9px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
                                        +{member.skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Performance Snippet */}
                        <div className="px-8 pb-8 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0B3C5D]/5 p-4 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={14} className="text-[#0B3C5D]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0B3C5D]/60 whitespace-nowrap">Active Tasks</span>
                                    </div>
                                    <div className="text-xl font-black text-[#0B3C5D]">{member.activeTasks || 0}</div>
                                </div>
                                <div className="bg-[#63C132]/5 p-4 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={14} className="text-[#63C132]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#63C132]/60 whitespace-nowrap">Load Status</span>
                                    </div>
                                    <div className={`text-base font-black ${member.activeTasks > 5 ? 'text-rose-500' : 'text-[#63C132]'}`}>
                                        {member.activeTasks > 5 ? 'High' : member.activeTasks > 2 ? 'Medium' : 'Optimal'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/tasks`, { state: { assigneeId: member._id, assigneeName: member.name } })}
                                className="w-full mt-6 py-4 bg-slate-50 text-[#0B3C5D] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#0B3C5D] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100"
                            >
                                <CalendarCheck size={16} />
                                View Assigned Tasks
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyTeam;
