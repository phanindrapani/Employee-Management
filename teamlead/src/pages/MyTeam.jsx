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

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) return <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 p-4 md:p-10">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-[32px] shadow-sm"></div>)}
    </div>;

    const { members, metadata } = data;

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 md:gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0B3C5D] tracking-tight mb-2 truncate max-w-full">
                        {metadata.teamName}
                    </h1>
                    <p className="text-slate-500 font-medium bg-slate-100/50 px-3 md:px-4 py-1 md:py-1.5 rounded-full inline-block text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] border border-slate-100 italic">
                        {metadata.departmentName} • Performance Monitoring
                    </p>
                </div>
                <div className="px-4 py-2 bg-[#63C132]/10 text-[#63C132] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#63C132]/20 w-fit">
                    {members.length} Members
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {members.map((member, idx) => (
                    <div key={member._id} className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:scale-[1.01] transition-all duration-500">
                        {/* Member Header */}
                        <div className="p-6 md:p-8 pb-4 relative">
                            <div className="absolute top-6 md:top-8 right-6 md:right-8 z-20">
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
                                        <button onClick={() => navigate(`/tasks`)} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B3C5D] flex items-center gap-3 transition-colors">
                                            <Briefcase size={14} className="text-blue-500" /> Assign Task
                                        </button>
                                        <button onClick={() => navigate(`/reports`)} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#63C132] flex items-center gap-3 transition-colors">
                                            <Activity size={14} className="text-[#63C132]" /> View Performance
                                        </button>
                                        <div className="h-px bg-slate-100 my-1 mx-4"></div>
                                        <button onClick={() => window.open(`mailto:${member.email}`)} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-500 flex items-center gap-3 transition-colors">
                                            <Mail size={14} className="text-rose-400" /> Email Member
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-white shadow-md md:shadow-lg">
                                        {member.profilePicture ? (
                                            <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-black text-[#0B3C5D]/20">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 md:border-4 border-white rounded-full ${member.isActive ? 'bg-[#63C132]' : 'bg-slate-300'}`}></div>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight truncate">{member.name}</h3>
                                        {member.isOnLeave && (
                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 text-[7px] md:text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100 whitespace-nowrap">
                                                On Leave
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{member.role}</p>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0"></span>
                                        <span className="text-[8px] md:text-[10px] font-black text-[#63C132] uppercase tracking-widest bg-[#63C132]/10 px-1.5 md:px-2 py-0.5 rounded-md">
                                            {member.experienceLevel || 'Junior'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Member Body */}
                        <div className="px-6 md:px-8 py-3 md:py-4 space-y-4">
                            <div className="flex items-center gap-3 text-xs md:text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl truncate">
                                <Mail size={14} className="text-blue-500 flex-shrink-0" />
                                <span className="truncate">{member.email}</span>
                            </div>

                            {/* Skills Tags */}
                            <div className="flex flex-wrap gap-2">
                                {member.skills && member.skills.length > 0 ? (
                                    member.skills.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="text-[8px] md:text-[9px] font-bold text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg uppercase tracking-tight">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[8px] font-bold text-slate-300 px-2 py-1 border border-dashed border-slate-200 rounded-lg uppercase">
                                        No Skills
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Performance Snippet */}
                        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2">
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="bg-[#0B3C5D]/5 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={12} className="text-[#0B3C5D]" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#0B3C5D]/60 whitespace-nowrap">Tasks</span>
                                    </div>
                                    <div className="text-lg md:text-xl font-black text-[#0B3C5D]">{member.activeTasks || 0}</div>
                                </div>
                                <div className="bg-[#63C132]/5 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={12} className="text-[#63C132]" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#63C132]/60 whitespace-nowrap">Load</span>
                                    </div>
                                    <div className={`text-xs md:text-sm font-black ${member.activeTasks > 5 ? 'text-rose-500' : 'text-[#63C132]'}`}>
                                        {member.activeTasks > 5 ? 'High' : member.activeTasks > 2 ? 'Med' : 'Opt'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/tasks`, { state: { assigneeId: member._id, assigneeName: member.name } })}
                                className="w-full mt-4 md:mt-6 py-3 md:py-4 bg-slate-50 text-[#0B3C5D] font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-[#0B3C5D] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100"
                            >
                                <CalendarCheck className="size-3.5 md:size-4" />
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
