import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { PlusSquare, ArrowLeft, Send } from 'lucide-react';

const CreateProject = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'medium',
        startDate: '',
        endDate: '',
        assignedTeam: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const { data } = await API.get('/admin/teams');
                setTeams(data);
            } catch (err) {
                console.error('Failed to fetch teams');
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/projects', formData);
            navigate('/projects');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create project');
        }
    };

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
                        <PlusSquare size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Create New Project</h1>
                        <p className="text-slate-500 font-medium text-sm">Fill in the details to launch a new project</p>
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
                                <label className="label">Assigned Team</label>
                                <select
                                    className="input-field"
                                    value={formData.assignedTeam}
                                    onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
                                    required
                                >
                                    <option value="">Select a team</option>
                                    {teams.map(team => (
                                        <option key={team._id} value={team._id}>{team.name} ({team.department?.name})</option>
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
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50">
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#63C132] text-white rounded-2xl font-black text-lg hover:bg-[#52A428] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#63C132]/20"
                        >
                            <Send size={24} />
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProject;
