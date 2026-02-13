import React, { useState, useEffect } from 'react';
import API from '../api';
import { Users2, Plus, Trash2, X, UserCheck, ShieldCheck } from 'lucide-react';

const TeamManagement = () => {
    const [teams, setTeams] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', department: '', teamLead: '' });

    const fetchData = async () => {
        try {
            const [teamsRes, deptsRes, empsRes] = await Promise.all([
                API.get('/teams'),
                API.get('/departments'),
                API.get('/employees')
            ]);
            setTeams(teamsRes.data);
            setDepartments(deptsRes.data);
            setEmployees(empsRes.data);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/teams', formData);
            setShowModal(false);
            setFormData({ name: '', department: '', teamLead: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await API.delete(`/teams/${id}`);
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Users2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Teams</h1>
                        <p className="text-slate-500 font-medium">Manage team structure and leads</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <Plus size={20} />
                    Add Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Loading teams...</div>
                ) : teams.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">No teams found</div>
                ) : (
                    teams.map((team) => (
                        <div key={team._id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 text-[#0B3C5D] rounded-lg">
                                    <Users2 size={24} />
                                </div>
                                <button
                                    onClick={() => handleDelete(team._id)}
                                    className="p-2 text-red-100 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold mb-1">{team.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-semibold uppercase tracking-wider">
                                <ShieldCheck size={14} className="text-[#63C132]" />
                                {team.department?.name || 'No Dept'}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#0B3C5D] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {team.teamLead?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-900">{team.teamLead?.name || 'Unassigned'}</p>
                                            <p className="text-slate-400">Team Lead</p>
                                        </div>
                                    </div>
                                    <UserCheck size={16} className="text-[#0B3C5D]" />
                                </div>

                                <div className="flex items-center justify-between text-xs px-1">
                                    <span className="text-slate-400 font-semibold">Members</span>
                                    <span className="text-[#0B3C5D] font-bold bg-[#F0F7FF] px-2 py-1 rounded-md">
                                        {team.members?.length || 0} Employees
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[24px]">
                            <h2 className="text-xl font-bold text-[#0B3C5D]">Add New Team</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Team Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Frontend Devs, Sales Ops"
                                />
                            </div>
                            <div>
                                <label className="label">Department</label>
                                <select
                                    className="input-field"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Team Lead</label>
                                <select
                                    className="input-field"
                                    value={formData.teamLead}
                                    onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                                >
                                    <option value="">Assign Team Lead (Optional)</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
