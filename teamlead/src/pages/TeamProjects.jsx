import React, { useState, useEffect } from 'react';
import {
    FolderKanban,
    Calendar,
    Clock,
    Layers,
    ArrowUpRight,
    Users,
    CheckCircle2
} from 'lucide-react';
import API from '../../api';

const TeamProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamProjects = async () => {
            try {
                const { data } = await API.get('/team/projects');
                setProjects(data);
                setLoading(false);
            } catch (error) {
                console.error("Fetch projects error:", error);
                setLoading(false);
            }
        };
        fetchTeamProjects();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return 'bg-[#63C132]/10 text-[#63C132]';
            case 'upcoming': return 'bg-blue-50 text-blue-600';
            case 'completed': return 'bg-slate-100 text-slate-500';
            case 'on-hold': return 'bg-amber-50 text-amber-500';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white rounded-[40px] shadow-sm"></div>)}
    </div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Team Projects</h1>
                    <p className="text-slate-500 font-medium">Strategic Overview • Project Milestones & Delivery Status</p>
                </div>
                <div className="px-6 py-3 bg-[#0B3C5D]/5 text-[#0B3C5D] rounded-full text-xs font-black uppercase tracking-widest border border-[#0B3C5D]/10">
                    {projects.length} Assigned Projects
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.length > 0 ? projects.map((project) => (
                    <div key={project._id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 bg-[#0B3C5D]/5 rounded-3xl flex items-center justify-center text-[#0B3C5D] group-hover:bg-[#63C132] group-hover:text-white transition-colors">
                                <FolderKanban size={32} />
                            </div>
                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>

                        <h3 className="text-2xl font-black text-[#0B3C5D] tracking-tight mb-4 group-hover:text-[#63C132] transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed line-clamp-2">
                            {project.description || "No project description provided. This project focuses on high-impact delivery for the organization."}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Execution Progress</span>
                                <span>{project.progress}%</span>
                            </div>
                            <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-[#0B3C5D] rounded-full transition-all duration-1000 group-hover:bg-[#63C132]"
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <Calendar size={18} className="text-[#63C132]" />
                                <div className="text-sm">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deadline</div>
                                    {new Date(project.endDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <Layers size={18} className="text-blue-500" />
                                <div className="text-sm">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</div>
                                    <span className="capitalize">{project.priority}</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-10 py-4 bg-slate-100 text-[#0B3C5D] font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-[#0B3C5D] hover:text-white transition-all transform group-hover:translate-y-[-2px]">
                            Project Intel
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                )) : (
                    <div className="col-span-2 py-32 bg-white rounded-[40px] border border-slate-100 border-dashed flex flex-col items-center gap-5">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <Layers size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Projects Allocated</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamProjects;
