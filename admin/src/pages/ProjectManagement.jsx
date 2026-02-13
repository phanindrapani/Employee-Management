import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FolderKanban, Plus, MoreVertical, Calendar, Users2, Activity, Trash2 } from 'lucide-react';

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProjects = async () => {
        try {
            const { data } = await API.get('/admin/projects');
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this project and all its tasks?')) return;
        try {
            await API.delete(`/admin/projects/${id}`);
            fetchProjects();
        } catch (err) {
            alert('Delete failed');
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">No projects found</div>
                ) : (
                    projects.map((project) => (
                        <div key={project._id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <button
                                    onClick={() => handleDelete(project._id)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 line-clamp-2">{project.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Users2 size={18} className="text-[#0B3C5D]" />
                                    <div className="text-xs">
                                        <p className="text-slate-400 font-medium">Team</p>
                                        <p className="font-bold">{project.assignedTeam?.name || 'Not assigned'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Calendar size={18} className="text-[#0B3C5D]" />
                                    <div className="text-xs">
                                        <p className="text-slate-400 font-medium">Deadline</p>
                                        <p className="font-bold">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-[#0B3C5D]">{project.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#63C132] transition-all duration-1000"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectManagement;
