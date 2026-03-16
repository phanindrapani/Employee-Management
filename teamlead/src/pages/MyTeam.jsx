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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member, idx) => (
                    <div key={member._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Simple Header */}
                        <div className="p-6 relative">
                            <div className="absolute top-4 right-4 text-slate-300">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === idx ? null : idx);
                                    }}
                                    className="p-1 hover:text-[#0B3C5D] transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {activeMenu === idx && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
                                        <button onClick={() => navigate(`/tasks`)} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                            <Briefcase size={14} /> Tasks
                                        </button>
                                        <button onClick={() => navigate(`/reports`)} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                            <Activity size={14} /> Performance
                                        </button>
                                        <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                        <button onClick={() => window.open(`mailto:${member.email}`)} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-rose-500">
                                            <Mail size={14} /> Contact
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-50">
                                        {member.profilePicture ? (
                                            <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-300">
                                                {member.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.isActive ? 'bg-[#63C132]' : 'bg-slate-300'}`}></div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0B3C5D]">{member.name}</h3>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md inline-block mr-2">
                                        {member.employeeId || 'EMP-N/A'}
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="px-6 py-4 bg-slate-50 border-y border-slate-100 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Tasks</div>
                                <div className="text-xl font-black text-[#0B3C5D]">{member.activeTasks || 0}</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                <div className={`text-xs font-black uppercase tracking-widest ${member.isOnLeave ? 'text-rose-500' : 'text-[#63C132]'}`}>
                                    {member.isOnLeave ? 'On Leave' : 'Available'}
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate">{member.email}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/tasks`, { state: { assigneeId: member._id, assigneeName: member.name } })}
                                className="w-full py-3 bg-white text-[#0B3C5D] border-2 border-[#0B3C5D]/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0B3C5D] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarCheck size={16} />
                                View Assignments
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyTeam;
