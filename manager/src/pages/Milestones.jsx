import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { 
    Target, 
    Plus, 
    Pencil, 
    Trash2, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    ChevronRight,
    Briefcase,
    Search,
    AlertCircle
} from 'lucide-react';

const Milestones = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [teams, setTeams] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        milestoneId: '',
        assignedTeam: '',
        dueDate: '',
        status: 'pending'
    });

    // Fetch all assigned projects first
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const [projRes, teamsRes] = await Promise.all([
                    API.get('/manager/projects'),
                    API.get('/manager/teams')
                ]);
                
                setProjects(projRes.data);
                setTeams(teamsRes.data);
                
                // If projectId is in URL, select it, otherwise select first project
                const urlProjectId = searchParams.get('projectId');
                if (urlProjectId) {
                    const proj = projRes.data.find(p => p._id === urlProjectId);
                    if (proj) setSelectedProject(proj);
                } else if (projRes.data.length > 0) {
                    setSelectedProject(projRes.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch initial data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Fetch milestones when selected project changes
    useEffect(() => {
        if (selectedProject) {
            fetchMilestones(selectedProject._id);
            setSearchParams({ projectId: selectedProject._id });
        }
    }, [selectedProject]);

    const fetchMilestones = async (projectId) => {
        setMilestonesLoading(true);
        try {
            const { data } = await API.get(`/manager/milestones/project/${projectId}`);
            setMilestones(data);
        } catch (error) {
            console.error('Failed to fetch milestones', error);
        } finally {
            setMilestonesLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMilestone) {
                await API.put(`/manager/milestones/${editingMilestone._id}`, formData);
            } else {
                await API.post('/manager/milestones', { ...formData, projectId: selectedProject._id });
            }
            setShowModal(false);
            setEditingMilestone(null);
            setFormData({ name: '', milestoneId: '', assignedTeam: '', dueDate: '', status: 'pending' });
            fetchMilestones(selectedProject._id);
        } catch (error) {
            alert('Failed to save milestone');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this milestone?')) return;
        try {
            await API.delete(`/manager/milestones/${id}`);
            fetchMilestones(selectedProject._id);
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3C5D]"></div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)]">
            {/* Project Selection Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 space-y-6">
                    <div>
                        <h2 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Briefcase size={16} className="text-[#63C132]" /> Select Project
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input 
                                type="text"
                                placeholder="Search projects..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredProjects.map(proj => (
                            <button
                                key={proj._id}
                                onClick={() => setSelectedProject(proj)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                    selectedProject?._id === proj._id 
                                    ? 'bg-[#0B3C5D] text-white shadow-lg' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <span className="text-xs font-black uppercase tracking-tight truncate mr-2">{proj.name}</span>
                                <ChevronRight size={14} className={selectedProject?._id === proj._id ? 'text-[#63C132]' : 'text-slate-300'} />
                            </button>
                        ))}
                        {filteredProjects.length === 0 && (
                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-4">No projects found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Milestones Content Workspace */}
            <div className="flex-1 space-y-8">
                {selectedProject ? (
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 min-h-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-[#0B3C5D] text-white rounded-2xl shadow-xl shadow-[#0B3C5D]/10">
                                    <Target size={28} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-[#0B3C5D] tracking-tight">{selectedProject.name}</h1>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Strategic Milestone Management</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingMilestone(null);
                                    setFormData({ name: '', milestoneId: '', assignedTeam: '', dueDate: '', status: 'pending' });
                                    setShowModal(true);
                                }}
                                className="w-full sm:w-auto px-6 py-4 bg-[#63C132] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#52A428] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#63C132]/20"
                            >
                                <Plus size={18} />
                                New Milestone
                            </button>
                        </div>

                        {milestonesLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Clock className="animate-spin text-slate-200" size={48} />
                            </div>
                        ) : milestones.length === 0 ? (
                            <div className="py-20 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 italic">
                                <Target size={64} className="mx-auto text-slate-100 mb-6" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No strategic phases defined for this initiative</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {milestones.map(m => (
                                    <div key={m._id} className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-5 hover:shadow-2xl hover:shadow-[#0B3C5D]/5 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    setEditingMilestone(m);
                                                    setFormData({
                                                        name: m.name,
                                                        milestoneId: m.milestoneId || '',
                                                        assignedTeam: m.assignedTeam?._id || m.assignedTeam || '',
                                                        dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
                                                        status: m.status
                                                    });
                                                    setShowModal(true);
                                                }} className="p-2 bg-white shadow-md text-slate-400 hover:text-[#0B3C5D] rounded-xl transition-all border border-slate-50"><Pencil size={14} /></button>
                                                <button onClick={() => handleDelete(m._id)} className="p-2 bg-white shadow-md text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-50"><Trash2 size={14} /></button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <h3 className="text-lg font-black text-[#0B3C5D] tracking-tight line-clamp-1">{m.name}</h3>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#0B3C5D]">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Due Date</p>
                                                        <p className="text-xs font-bold text-slate-600 mt-0.5">{m.dueDate ? new Date(m.dueDate).toLocaleDateString(undefined, {dateStyle: 'medium'}) : 'TBD'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#0B3C5D]">
                                                        <Briefcase size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Responsible Team</p>
                                                        <p className="text-xs font-bold text-slate-600 mt-0.5 truncate max-w-[140px]">{m.assignedTeam?.name || 'Pending Assignment'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                                    m.status === 'completed' ? 'bg-[#63C132] text-white' : 
                                                    m.status === 'in-progress' ? 'bg-[#0B3C5D] text-white' : 
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {m.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                    {m.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white p-20 rounded-[40px] shadow-sm border border-slate-50 text-center space-y-6">
                        <Target size={80} className="mx-auto text-slate-100" />
                        <div>
                            <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight">Access Your Portfolio</h2>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Select a project from the sidebar to manage its strategic milestones and delivery phases.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Integrated Milestone Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/30 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#0B3C5D] text-white rounded-2xl shadow-lg">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight">{editingMilestone ? 'Refine Phase' : 'Establish Phase'}</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Project Milepost Identity</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <CheckCircle2 size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phase Designation</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Strategic Planning, System Architecture..."
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 font-bold text-[#0B3C5D] placeholder:text-slate-300"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tracking ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., M1, PHASE-A, V1.0"
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 font-bold text-[#0B3C5D] placeholder:text-slate-300"
                                    value={formData.milestoneId}
                                    onChange={e => setFormData({ ...formData, milestoneId: e.target.value })}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Collective</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 font-bold text-[#0B3C5D] appearance-none"
                                            value={formData.assignedTeam}
                                            onChange={e => setFormData({ ...formData, assignedTeam: e.target.value })}
                                        >
                                            <option value="">Select Team</option>
                                            {teams.map(team => (
                                                <option key={team._id} value={team._id}>{team.name}</option>
                                            ))}
                                        </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 font-bold text-[#0B3C5D]"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {editingMilestone && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Status</label>
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                                        {['pending', 'in-progress', 'completed'].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: s })}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    formData.status === s ? 'bg-white shadow-md text-[#0B3C5D]' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="flex-1 py-4 bg-slate-100 text-[#0B3C5D] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#0B3C5D]/20 hover:bg-[#1A4B6D] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    {editingMilestone ? 'Update Phase' : 'Activate Phase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Milestones;
