import React, { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    Briefcase,
    Activity,
    CalendarCheck,
    MoreHorizontal
} from 'lucide-react';
import API from '../../api';

const MyTeam = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const { data } = await API.get('/team/members');
                setMembers(data);
                setLoading(false);
            } catch (error) {
                console.error("Fetch team members error:", error);
                setLoading(false);
            }
        };
        fetchTeamMembers();
    }, []);

    if (loading) return <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-[32px] shadow-sm"></div>)}
    </div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">My Team</h1>
                    <p className="text-slate-500 font-medium">Human Resources • Performance & Workload Monitoring</p>
                </div>
                <div className="px-6 py-3 bg-[#63C132]/10 text-[#63C132] rounded-full text-xs font-black uppercase tracking-widest border border-[#63C132]/20">
                    {members.length} Active Members
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {members.map((member) => (
                    <div key={member._id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                        {/* Member Header */}
                        <div className="p-8 pb-4 relative">
                            <div className="absolute top-8 right-8 text-slate-300 hover:text-[#0B3C5D] cursor-pointer">
                                <MoreHorizontal />
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
                                    <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight">{member.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Member Body */}
                        <div className="px-8 py-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl">
                                <Mail size={16} className="text-blue-500" />
                                {member.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl">
                                <Phone size={16} className="text-[#63C132]" />
                                {member.phone}
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

                            <button className="w-full mt-6 py-4 bg-slate-50 text-[#0B3C5D] font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#0B3C5D] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100">
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
