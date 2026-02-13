import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Users, Plus, Search, Filter, MoreVertical, Edit2,
    Trash2, Mail, Phone, MapPin, X, Save, File, Eye, UserPlus, BookOpen, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeCRUD = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'employee',
        department: '',
        team: '',
        reportingManager: '',
        skills: '',
        experienceLevel: '',
        phone: '',
        qualification: ''
    });



    const fetchData = async () => {
        try {
            const [empRes, deptRes, teamRes] = await Promise.all([
                API.get('/admin/employees'),
                API.get('/admin/departments'),
                API.get('/admin/teams')
            ]);
            setEmployees(empRes.data);
            setDepartments(deptRes.data);
            setTeams(teamRes.data);
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
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });


            if (editingEmployee) {
                await API.put(`/admin/employees/${editingEmployee._id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await API.post('/admin/employees', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            setEditingEmployee(null);
            setFormData({
                name: '', email: '', role: 'employee', department: '', team: '',
                reportingManager: '', skills: '', experienceLevel: ''
            });

            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await API.delete(`/admin/employees/${id}`);
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const buildFileUrl = (filePath) => {
        if (!filePath) return '#';
        if (typeof filePath === 'string' && filePath.startsWith('http')) return filePath;

        // For local files, fallback to port 5000 if API base URL is not available
        const rawBaseUrl = API?.defaults?.baseURL || 'http://localhost:5000/api';
        const baseUrl = rawBaseUrl.replace(/\/api\/?$/, '');

        const normalized = String(filePath).replace(/\\/g, '/');
        const uploadsIndex = normalized.indexOf('uploads/');
        const relativePath = uploadsIndex >= 0 ? normalized.slice(uploadsIndex) : normalized.replace(/^\/+/, '');

        return `${baseUrl}/${relativePath}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3XL font-extrabold tracking-tight">Employees</h1>
                        <p className="text-slate-500 font-medium">Manage all employees</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setFormData({ name: '', email: '', phone: '', qualification: '', address: '' });
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <UserPlus size={20} />
                    Add Employee
                </button>
            </div>

            <div className="card shadow-sm border-none bg-white p-6">
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-black tracking-[0.1em]">
                                <th className="pb-4 px-4 font-black">Employee</th>
                                <th className="pb-4 px-4 font-black">Contact</th>
                                <th className="pb-4 px-4 font-black">Qualification</th>
                                <th className="pb-4 px-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">Loading employees...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">No employees found</td></tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold overflow-hidden border border-slate-100">
                                                    {emp.profilePicture ? (
                                                        <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        emp.name.charAt(0)
                                                    )}
                                                </div>
                                                <span className="font-medium text-slate-900">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {emp.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {emp.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <BookOpen size={14} className="text-primary-500" />
                                                {emp.qualification}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/employees/${emp._id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details & Documents"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingEmployee(emp);
                                                        setFormData({
                                                            name: emp.name,
                                                            email: emp.email,
                                                            role: emp.role || 'employee',
                                                            department: emp.department?._id || emp.department || '',
                                                            team: emp.team?._id || emp.team || '',
                                                            reportingManager: emp.reportingManager?._id || '',
                                                            skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : '',
                                                            experienceLevel: emp.experienceLevel || '',
                                                            phone: emp.phone || '',
                                                            qualification: emp.qualification || ''
                                                        });
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[24px] flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#0B3C5D] text-white rounded-lg">
                                    <UserPlus size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-[#0B3C5D]">
                                    {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-200 text-slate-400 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email Address</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={!!editingEmployee}
                                    />
                                    {!editingEmployee && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Default login password will be FirstName+123
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Qualification</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="label">Team</label>
                                    <select
                                        className="input-field"
                                        value={formData.team}
                                        onChange={(e) => {
                                            const selectedTeamId = e.target.value;
                                            const selectedTeam = teams.find(t => t._id === selectedTeamId);
                                            setFormData({
                                                ...formData,
                                                team: selectedTeamId,
                                                reportingManager: selectedTeam?.teamLead?._id || selectedTeam?.teamLead || ''
                                            });
                                        }}
                                    >
                                        <option value="">Select Team</option>
                                        {teams
                                            .filter(t => !formData.department || t.department?._id === formData.department || t.department === formData.department)
                                            .map(team => (
                                                <option key={team._id} value={team._id}>{team.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Reporting Manager</label>
                                    <select
                                        className="input-field opacity-70 cursor-not-allowed"
                                        value={formData.reportingManager}
                                        disabled
                                    >
                                        <option value="">
                                            {formData.team ? 'Team Lead (Auto)' : 'Select Team First'}
                                        </option>
                                        {employees
                                            .filter(emp => emp.role === 'team-lead')
                                            .map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Experience Level</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.experienceLevel}
                                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                />
                            </div>





                            <div className="flex gap-3 pt-4 border-t border-slate-200 flex-shrink-0 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                >
                                    {editingEmployee ? 'Update Employee' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeCRUD;
