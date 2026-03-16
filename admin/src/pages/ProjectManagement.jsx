import React, { useState, useEffect } from 'react';
import useSocketListener from '../hooks/useSocketListener';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useConfirmation } from '../context/ConfirmationContext';
import { useToast } from '../context/ToastContext';
import { FolderKanban, Plus, MoreVertical, Calendar, Users2, Activity, Trash2, Pencil } from 'lucide-react';

const ProjectManagement = () => {
    const [projects, setProjects] = useState(() => {
        const cached = localStorage.getItem('ls_admin_projects_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(projects.length === 0);
    const navigate = useNavigate();
    const confirm = useConfirmation();
    const { showToast } = useToast();

    const fetchProjects = async () => {
        try {
            const { data } = await API.get('/admin/projects');
            setProjects(data);
            localStorage.setItem('ls_admin_projects_list', JSON.stringify(data));
        } catch (err) {
            console.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useSocketListener('project:created', fetchProjects);
    useSocketListener('project:updated', fetchProjects);
    useSocketListener('project:deleted', fetchProjects);

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Project',
            message: 'Are you sure you want to delete this project and all its tasks? This action cannot be undone.',
            confirmLabel: 'Delete Project',
            type: 'danger'
        });

        if (!isConfirmed) return;

        try {
            await API.delete(`/admin/projects/${id}`);
            showToast('Project deleted successfully', 'success');
            fetchProjects();
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'ongoing': return 'bg-blue-100 text-blue-700';
            case 'on-hold': return 'bg-orange-100 text-orange-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <FolderKanban size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
                        <p className="text-slate-500 font-medium">Track and manage all company projects</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/projects/create')}
                    className="px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <Plus size={20} />
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse italic">
                        Syncing Project Portfolios...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="col-span-full py-24 text-center">
                        <FolderKanban size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active projects discovered</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50 group-hover:bg-[#63C132] transition-colors duration-500" />

                            <div className="flex justify-between items-start mb-8">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] leading-none ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/projects/edit/${project._id}`)}
                                        className="p-2.5 text-slate-300 hover:text-[#0B3C5D] hover:bg-[#F0F7FF] rounded-2xl transition-all"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project._id)}
                                        className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-[#0B3C5D] mb-2 group-hover:text-[#63C132] transition-colors duration-300">{project.name}</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2 italic">{project.description || 'Strategic development initiative.'}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                                    <div className="w-10 h-10 flex items-center justify-center bg-[#0B3C5D] rounded-2xl text-white text-xs font-black shadow-lg shadow-[#0B3C5D]/10">
                                        {project.managerId?.name?.charAt(0) || 'M'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Project Manager</p>
                                        <p className="text-xs font-black text-[#0B3C5D] truncate">{project.managerId?.name || 'Not Assigned'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                                    <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Due Date</p>
                                        <p className="text-xs font-black text-[#0B3C5D]">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No Date'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                                    <div className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                                        <Activity size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Client</p>
                                        <p className="text-xs font-black text-[#0B3C5D] truncate">{project.clientId?.name || 'Internal'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Project Progress</p>
                                        <span className="text-sm font-black text-[#0B3C5D]">{project.progress}%</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[#63C132] uppercase tracking-tighter">On Track</span>
                                </div>
                                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                                    <div
                                        className="h-full bg-[#63C132] rounded-full transition-all duration-1000 ease-out shadow-sm shadow-[#63C132]/40 relative overflow-hidden"
                                        style={{ width: `${project.progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default ProjectManagement;
