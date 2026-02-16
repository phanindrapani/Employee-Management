import React, { useState, useEffect } from 'react';
import {
    FolderKanban,
    Calendar,
    ChevronRight,
    X,
    Users2,
    Activity,
    Target
} from 'lucide-react';
import API from '../../api';

const ProjectDetailsModal = ({ project, onClose }) => {
    if (!project) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100">
                {/* Header Section */}
                <div className="relative p-8 bg-white border-b border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-50 rounded-2xl text-[#0B3C5D]">
                            <FolderKanban size={28} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                                {project.status}
                            </span>
                            <span className="text-slate-400 text-xs font-bold font-mono">ID: {project._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 leading-tight">{project.name}</h2>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Activity size={12} /> Project Overview
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{project.description}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                <Calendar size={12} className="text-[#0B3C5D]" /> Timeline
                            </div>
                            <div className="text-[#0B3C5D] font-black text-sm">
                                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                <Users2 size={12} className="text-[#0B3C5D]" /> Assigned Team
                            </div>
                            <div className="text-[#0B3C5D] font-black text-sm">
                                {project.assignedTeam?.name || 'Technical Team'}
                            </div>
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div className="p-6 bg-[#F0F7FF] rounded-[32px] border border-blue-50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest">
                                <Target size={14} /> Completion Progress
                            </div>
                            <span className="text-xl font-black text-[#0B3C5D]">{project.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-white rounded-full overflow-hidden p-0.5">
                            <div
                                className="h-full bg-[#63C132] rounded-full transition-all duration-1000"
                                style={{ width: `${project.progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-[#0B3C5D] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#1a4a6e] transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetch projects assigned to the employee's team
                const { data } = await API.get('/team/projects');
                setProjects(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching projects:", error);
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return 'bg-blue-100 text-blue-600';
            case 'completed': return 'bg-emerald-100 text-emerald-600';
            case 'upcoming': return 'bg-slate-100 text-slate-600';
            case 'on-hold': return 'bg-amber-100 text-amber-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (loading) return <div className="p-8 animate-pulse space-y-4">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100"></div>)}
        </div>
    </div>;

    return (
        <div className="p-4 md:p-8 space-y-10">
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">My Projects</h1>
                    <p className="text-slate-500 font-medium text-sm italic">Overview of active and upcoming team initiatives</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                    <div key={project._id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedProject(project)}>
                        <div className="p-8 space-y-6 flex-1">
                            <div className="flex justify-between items-start">
                                <div className={`p-4 rounded-2xl ${getStatusColor(project.status)} bg-opacity-10 text-current`}>
                                    <FolderKanban size={24} />
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">{project.name}</h3>
                                <p className="text-xs text-slate-500 font-medium line-clamp-2">{project.description}</p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Progress</span>
                                    <span className="text-[#0B3C5D]">{project.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#63C132] rounded-full transition-all duration-1000"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Calendar size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(project.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <button className="text-[#0B3C5D] hover:text-[#63C132] transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {projects.length === 0 && !loading && (
                <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <FolderKanban size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 mb-2">No Projects Found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">You haven't been assigned to any projects yet. Contact your Team Lead to get started.</p>
                </div>
            )}

            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
};

export default MyProjects;
