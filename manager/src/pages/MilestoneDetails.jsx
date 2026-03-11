import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { Plus, Pencil, Trash2, Calendar, Target, ChevronLeft, CheckCircle2, Clock } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import useSocketListener from '../hooks/useSocketListener';

const MilestoneDetails = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [milestones, setMilestones] = useLocalStorage(`manager_milestone_details_${projectId}_${user?._id}`, []);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        assignedTeam: '',
        dueDate: '',
        status: 'pending'
    });

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [projRes, mileRes, teamRes] = await Promise.all([
                API.get('/manager/projects'),
                API.get(`/manager/milestones/project/${projectId}`),
                API.get('/admin/teams') // Using admin endpoint to get teams list for manager
            ]);
            const proj = projRes.data.find(p => p._id === projectId);
            setProject(proj);
            setMilestones(mileRes.data);
            setTeams(teamRes.data);
        } catch (error) {
            console.error('Failed to fetch milestone data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    useSocketListener('milestone:updated', fetchData);
    useSocketListener('task:updated', fetchData);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMilestone) {
                await API.put(`/manager/milestones/${editingMilestone._id}`, formData);
            } else {
                await API.post('/manager/milestones', { ...formData, projectId });
            }
            setShowModal(false);
            setEditingMilestone(null);
            setFormData({ name: '', assignedTeam: '', dueDate: '', status: 'pending' });
            fetchData();
        } catch (error) {
            alert('Failed to save milestone');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this milestone?')) return;
        try {
            await API.delete(`/manager/milestones/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-slate-400 hover:text-[#0B3C5D] font-bold transition-all">
                    <ChevronLeft size={20} />
                    Back to Projects
                </button>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0B3C5D]/5 text-[#0B3C5D] rounded-2xl">
                            <Target size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#0B3C5D]">{project?.name} - Milestones</h1>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Define strategic phases and assign teams</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditingMilestone(null);
                            setFormData({ name: '', assignedTeam: '', dueDate: '', status: 'pending' });
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20"
                    >
                        <Plus size={20} />
                        New Milestone
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {milestones.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                            <Target size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No milestones defined yet</p>
                        </div>
                    ) : (
                        milestones.map(m => (
                            <div key={m._id} className="bg-slate-50/30 p-6 rounded-[32px] border border-slate-100 space-y-4 hover:bg-white hover:shadow-xl hover:shadow-[#0B3C5D]/5 transition-all group">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-black text-[#0B3C5D]">{m.name}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            setEditingMilestone(m);
                                            setFormData({
                                                name: m.name,
                                                assignedTeam: m.assignedTeam?._id || m.assignedTeam || '',
                                                dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
                                                status: m.status
                                            });
                                            setShowModal(true);
                                        }} className="p-2 text-slate-400 hover:text-[#0B3C5D] transition-colors"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(m._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Calendar size={14} className="text-[#0B3C5D]" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No date'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-[10px] font-black text-[#0B3C5D]">T</div>
                                        <span className="text-xs font-bold uppercase tracking-widest">{m.assignedTeam?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${m.status === 'completed' ? 'bg-[#63C132] text-white' : m.status === 'in-progress' ? 'bg-[#0B3C5D] text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {m.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {m.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                            <div className="p-3 bg-[#0B3C5D] text-white rounded-2xl shadow-lg">
                                <Target size={24} />
                            </div>
                            <h2 className="text-xl font-black text-[#0B3C5D]">{editingMilestone ? 'Edit Milestone' : 'New Milestone'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Milestone Name</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0B3C5D] focus:ring-0 transition-all font-bold text-[#0B3C5D]"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Team</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0B3C5D] focus:ring-0 transition-all font-bold text-[#0B3C5D]"
                                        value={formData.assignedTeam}
                                        onChange={e => setFormData({ ...formData, assignedTeam: e.target.value })}
                                    >
                                        <option value="">Select Team</option>
                                        {project?.assignedTeams?.map(team => (
                                            <option key={team._id} value={team._id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0B3C5D] focus:ring-0 transition-all font-bold text-[#0B3C5D]"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            {editingMilestone && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0B3C5D] focus:ring-0 transition-all font-bold text-[#0B3C5D]"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-[#63C132] text-white rounded-2xl font-black shadow-lg shadow-[#63C132]/20 hover:bg-[#52A428] transition-all">Save Milestone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MilestoneDetails;
