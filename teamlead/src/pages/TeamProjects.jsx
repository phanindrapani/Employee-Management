import React, { useState, useEffect } from 'react';
import {
    FolderKanban,
    Calendar,
    Clock,
    Layers,
    ArrowUpRight,
    X,
    Activity,
    Target,
    Settings2,
    Save,
    RefreshCw
} from 'lucide-react';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const ProjectDetailsModal = ({ project, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [tempProgress, setTempProgress] = useState(project.progress);
    const [mode, setMode] = useState(project.progressMode || 'auto');
    const [error, setError] = useState(null);

    const handleSaveProgress = async () => {
        setIsUpdating(true);
        setError(null);
        try {
            const { data } = await API.put(`/team/projects/${project._id}/progress`, {
                progress: mode === 'manual' ? tempProgress : undefined,
                mode: mode
            });
            onUpdate(data);
            setIsUpdating(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update progress");
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="relative p-10 bg-white border-b border-slate-50">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-4 bg-[#0B3C5D]/5 rounded-3xl text-[#0B3C5D]">
                            <FolderKanban size={32} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-4 py-1.5 bg-[#63C132]/10 text-[#63C132] text-[10px] font-black uppercase tracking-widest rounded-full">
                                {project.status}
                            </span>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${mode === 'auto' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                <Settings2 size={12} /> {mode} Mode
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{project.name}</h2>
                    </div>
                </div>

                <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Activity size={14} /> Description
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{project.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Calendar size={14} className="text-[#63C132]" /> Deadline
                            </div>
                            <div className="text-[#0B3C5D] font-black text-sm">{new Date(project.endDate).toLocaleDateString()}</div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Layers size={14} className="text-blue-500" /> Priority
                            </div>
                            <div className="text-[#0B3C5D] font-black text-sm capitalize">{project.priority}</div>
                        </div>
                    </div>

                    <div className={`p-8 rounded-[40px] border ${mode === 'auto' ? 'bg-[#F0F7FF] border-blue-100' : 'bg-amber-50/30 border-amber-100'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest">
                                <Target size={18} /> Completion
                            </div>
                            {mode === 'manual' ? (
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-amber-200">
                                    <input
                                        type="number"
                                        value={tempProgress}
                                        onChange={(e) => setTempProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-16 text-center text-lg font-black text-[#0B3C5D] bg-transparent outline-none focus:ring-0"
                                    />
                                    <span className="text-sm font-black text-slate-400">%</span>
                                </div>
                            ) : (
                                <span className="text-3xl font-black text-[#0B3C5D]">{project.progress}%</span>
                            )}
                        </div>
                        <div className="h-4 bg-white rounded-full overflow-hidden p-1 shadow-inner">
                            <div
                                className="h-full bg-[#63C132] rounded-full transition-all duration-1000"
                                style={{ width: `${mode === 'manual' ? tempProgress : project.progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Controls</h4>
                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setMode('auto')}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${mode === 'auto' ? 'bg-[#0B3C5D] text-white shadow-lg' : 'text-slate-400 hover:text-[#0B3C5D]'}`}
                                >
                                    Auto
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${mode === 'manual' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-amber-500'}`}
                                >
                                    Manual
                                </button>
                            </div>
                        </div>

                        {(mode !== project.progressMode || (mode === 'manual' && tempProgress !== project.progress)) && (
                            <button
                                onClick={handleSaveProgress}
                                disabled={isUpdating}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-[#63C132] text-white text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-[#52a329] transition-all disabled:opacity-50 shadow-lg shadow-[#63C132]/20"
                            >
                                {isUpdating ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                Apply Changes
                            </button>
                        )}
                        {error && <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>}
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {project.lastCalculatedAt ? `Last Sync: ${new Date(project.lastCalculatedAt).toLocaleString()}` : 'Sync Pending'}
                    </div>
                    <button onClick={onClose} className="px-10 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#1a4a6e] transition-all">
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

const TeamProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);

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

    useEffect(() => {
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

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse p-10">
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
                    <div key={project._id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer" onClick={() => setSelectedProject(project)}>
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
                            {project.description || "No project description provided."}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Execution Progress</span>
                                <span className="flex items-center gap-1.5">
                                    {project.progressMode === 'manual' && <Settings2 size={10} className="text-amber-500" />}
                                    {project.progress}%
                                </span>
                            </div>
                            <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${project.progressMode === 'manual' ? 'bg-amber-500' : 'bg-[#0B3C5D] group-hover:bg-[#63C132]'}`}
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
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mode</div>
                                    <span className="capitalize">{project.progressMode || 'Auto'}</span>
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

            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdate={(updatedProject) => {
                        setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
                        setSelectedProject(updatedProject);
                    }}
                />
            )}
        </div>
    );
};

export default TeamProjects;
