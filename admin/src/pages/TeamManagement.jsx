import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { Users2, Plus, Trash2, X, UserCheck, ShieldCheck, Pencil } from 'lucide-react';
import useSocketListener from '../hooks/useSocketListener';
import { useConfirmation } from '../context/ConfirmationContext';
import { useToast } from '../context/ToastContext';

const TeamManagement = () => {
    const [teams, setTeams] = useState(() => {
        const cached = localStorage.getItem('ls_admin_teams_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [departments, setDepartments] = useState(() => {
        const cached = localStorage.getItem('ls_admin_departments_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [employees, setEmployees] = useState(() => {
        const cached = localStorage.getItem('ls_admin_employees_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(teams.length === 0);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        teamLead: '',
        manager: '',
        members: []
    });
    const confirm = useConfirmation();
    const { showToast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const [teamsRes, deptsRes, empsRes] = await Promise.all([
                API.get('/admin/teams'),
                API.get('/admin/departments'),
                API.get('/admin/employees')
            ]);
            setTeams(teamsRes.data);
            setDepartments(deptsRes.data);
            setEmployees(empsRes.data);
            localStorage.setItem('ls_admin_teams_list', JSON.stringify(teamsRes.data));
            localStorage.setItem('ls_admin_departments_list', JSON.stringify(deptsRes.data));
            localStorage.setItem('ls_admin_employees_list', JSON.stringify(empsRes.data));
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useSocketListener('team:created', fetchData);
    useSocketListener('team:updated', fetchData);
    useSocketListener('team:deleted', fetchData);
    useSocketListener('team:member_added', fetchData);
    useSocketListener('department:created', fetchData);
    useSocketListener('department:updated', fetchData);
    useSocketListener('employee:created', fetchData);
    useSocketListener('employee:updated', fetchData);

    const toggleMember = (id) => {
        setFormData(prev => {
            const members = prev.members.includes(id)
                ? prev.members.filter(m => m !== id)
                : [...prev.members, id];
            return { ...prev, members };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.put(`/admin/teams/${editingId}`, formData);
            } else {
                await API.post('/admin/teams', formData);
            }
            setShowModal(false);
            setFormData({ name: '', department: '', teamLead: '', manager: '', members: [] });
            setIsEditing(false);
            setEditingId(null);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        }
    };

    const handleEdit = (team) => {
        setFormData({
            name: team.name,
            department: team.department?._id || team.department,
            teamLead: team.teamLead?._id || team.teamLead,
            manager: team.manager?._id || team.manager || '',
            members: team.members?.map(m => m._id || m) || []
        });
        setEditingId(team._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Team',
            message: 'Are you sure you want to delete this team? This action cannot be undone.',
            confirmLabel: 'Delete Team',
            type: 'danger'
        });

        if (!isConfirmed) return;

        try {
            await API.delete(`/admin/teams/${id}`);
            showToast('Team deleted successfully', 'success');
            fetchData();
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    return (
        <div className="space-y-8 text-[#0B3C5D]">
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
                    onClick={() => {
                        setFormData({ name: '', department: '', teamLead: '', manager: '', members: [] });
                        setIsEditing(false);
                        setEditingId(null);
                        setShowModal(true);
                    }}
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(team)}
                                        className="p-2 text-slate-300 hover:text-[#0B3C5D] hover:bg-slate-50 rounded-lg transition-all"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team._id)}
                                        className="p-2 text-red-100 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-1">{team.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-semibold uppercase tracking-wider">
                                <ShieldCheck size={14} className="text-[#63C132]" />
                                {team.department?.name || 'No Dept'}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#63C132] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {team.manager?.name?.charAt(0) || 'M'}
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-900">{team.manager?.name || 'Unassigned'}</p>
                                            <p className="text-slate-400">Reporting Manager</p>
                                        </div>
                                    </div>
                                    <ShieldCheck size={16} className="text-[#63C132]" />
                                </div>

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
                                        {team.members?.filter(m => (m._id || m) !== (team.teamLead?._id || team.teamLead)).length || 0} Employees
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-[#0B3C5D]">
                                {isEditing ? 'Edit Team' : 'Add New Team'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Team Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. Frontend Devs"
                                    />
                                </div>
                                <div>
                                    <label className="label">Department</label>
                                    <select
                                        className="input-field"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value, teamLead: '', manager: '', members: [] })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Reporting Manager</label>
                                    <select
                                        className="input-field"
                                        value={formData.manager}
                                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    >
                                        <option value="">Select Manager</option>
                                        {employees
                                            .filter(emp => emp.role === 'manager' || emp.role === 'admin')
                                            .map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
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
                                        {employees
                                            .filter(emp => !formData.department || emp.department?._id === formData.department || emp.department === formData.department)
                                            .map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label mb-2 block">Select Team Members</label>
                                <div className="border border-slate-100 rounded-xl max-h-48 overflow-y-auto p-2 bg-slate-50/30">
                                    {employees
                                        .filter(emp => (!formData.department || emp.department?._id === formData.department || emp.department === formData.department) && emp._id !== formData.teamLead && (emp._id || emp) !== (formData.teamLead?._id || formData.teamLead))
                                        .map(emp => (
                                            <label key={emp._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-[#0B3C5D] focus:ring-[#0B3C5D]"
                                                    checked={formData.members.includes(emp._id)}
                                                    onChange={() => toggleMember(emp._id)}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{emp.name}</span>
                                                    <span className="text-[10px] text-slate-400">{emp.email}</span>
                                                </div>
                                            </label>
                                        ))}
                                    {employees.filter(emp => !formData.department || emp.department?._id === formData.department || emp.department === formData.department).length === 0 && (
                                        <p className="text-center py-4 text-xs text-slate-400">No employees found in this department</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">
                                    {isEditing ? 'Save Changes' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
