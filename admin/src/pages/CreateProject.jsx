import React, { useState, useEffect } from 'react';
import { PlusSquare, ArrowLeft, Send, PencilLine } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api';

const CreateProject = () => {
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'medium',
        startDate: '',
        endDate: '',
        assignedTeams: [],
        managerId: '',
        clientId: '',
        status: 'upcoming',
        progress: 0
    });

    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: managersData } = await API.get('/admin/employees?role=manager');
                setManagers(managersData);

                const { data: clientsData } = await API.get('/admin/employees?role=client');
                setClients(clientsData);

                if (isEdit) {
                    const { data: projectData } = await API.get('/admin/projects');
                    localStorage.setItem('ls_admin_projects_list', JSON.stringify(projectData));
                    const project = projectData.find(p => p._id === id);
                    if (project) {
                        setFormData({
                            name: project.name,
                            description: project.description,
                            priority: project.priority,
                            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                            assignedTeams: project.assignedTeams?.map(t => t._id || t) || [],
                            managerId: project.managerId?._id || project.managerId || '',
                            clientId: project.clientId?._id || project.clientId || '',
                            status: project.status,
                            progress: project.progress
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        // Populate from cache if editing and projects are already cached
        if (isEdit) {
            const cachedProjects = localStorage.getItem('ls_admin_projects_list');
            if (cachedProjects) {
                const project = JSON.parse(cachedProjects).find(p => p._id === id);
                if (project) {
                    setFormData({
                        name: project.name,
                        description: project.description,
                        priority: project.priority,
                        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                        assignedTeams: project.assignedTeams?.map(t => t._id || t) || [],
                        clientId: project.clientId?._id || project.clientId || '',
                        status: project.status,
                        progress: project.progress
                    });
                }
            }
        }

        fetchData();
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await API.put(`/admin/projects/${id}`, formData);
            } else {
                await API.post('/admin/projects', formData);
            }
            navigate('/projects');
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} project`);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-2 text-slate-400 hover:text-[#0B3C5D] font-bold transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Projects
                </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-[#0B3C5D] text-white rounded-2xl shadow-lg">
                        {isEdit ? <PencilLine size={24} /> : <PlusSquare size={24} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            {isEdit ? 'Edit Project' : 'Create New Project'}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            {isEdit ? 'Update project details and progress' : 'Fill in the details to launch a new project'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="label">Project Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Website Redesign 2024"
                                />
                            </div>
                            <div>
                                <label className="label">Project Manager</label>
                                <select
                                    className="input-field"
                                    value={formData.managerId}
                                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a manager</option>
                                    {managers.map(manager => (
                                        <option key={manager._id} value={manager._id}>{manager.name} ({manager.uid})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Client</label>
                                <select
                                    className="input-field"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a client</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>{client.name} {client.company ? `(${client.company})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Priority</label>
                                <div className="flex gap-4">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            className={`flex-1 py-3 rounded-xl border-2 font-bold capitalize transition-all ${formData.priority === p
                                                ? 'border-[#0B3C5D] bg-[#0B3C5D] text-white'
                                                : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    className="input-field h-[116px] resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What is this project about?"
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Start Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {isEdit && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Status</label>
                                        <select
                                            className="input-field"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50">
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#63C132] text-white rounded-2xl font-black text-lg hover:bg-[#52A428] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#63C132]/20"
                        >
                            {isEdit ? <PencilLine size={24} /> : <Send size={24} />}
                            {isEdit ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProject;
