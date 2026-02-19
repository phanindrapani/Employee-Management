import React, { useState, useEffect, useCallback } from 'react';
import useSocketListener from '../hooks/useSocketListener';
import API from '../api';
import {
    Users, Search, Edit2,
    Trash2, Mail, Phone, BookOpen, X, UserPlus, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeCRUD = () => {
    const initialFormData = {
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
    };

    const navigate = useNavigate();
    const [employees, setEmployees] = useState(() => {
        const cached = localStorage.getItem('ls_admin_employees_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [departments, setDepartments] = useState(() => {
        const cached = localStorage.getItem('ls_admin_departments_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [teams, setTeams] = useState(() => {
        const cached = localStorage.getItem('ls_admin_teams_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(employees.length === 0);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState(initialFormData);

    const fetchData = useCallback(async () => {
        try {
            const [empRes, deptRes, teamRes] = await Promise.all([
                API.get('/admin/employees'),
                API.get('/admin/departments'),
                API.get('/admin/teams')
            ]);
            setEmployees(empRes.data);
            setDepartments(deptRes.data);
            setTeams(teamRes.data);
            localStorage.setItem('ls_admin_employees_list', JSON.stringify(empRes.data));
            localStorage.setItem('ls_admin_departments_list', JSON.stringify(deptRes.data));
            localStorage.setItem('ls_admin_teams_list', JSON.stringify(teamRes.data));
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useSocketListener('employee:created', fetchData);
    useSocketListener('employee:updated', fetchData);
    useSocketListener('employee:deleted', fetchData);

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
            setFormData(initialFormData);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
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

    return (
        <div className="space-y-6 md:space-y-8 text-[#0B3C5D]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Users size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Employees</h1>
                        <p className="text-xs md:text-base text-slate-500 font-medium italic">Manage staff directory</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setFormData(initialFormData);
                        setShowModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <UserPlus size={20} />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-slate-50 p-4 md:p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        className="w-full pl-12 pr-4 py-3 md:py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-600 text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] md:text-[11px] uppercase font-black tracking-widest">
                                <th className="pb-4 px-2">Employee</th>
                                <th className="pb-4 px-2 hidden md:table-cell">Contact</th>
                                <th className="pb-4 px-2">Qualification</th>
                                <th className="pb-4 px-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {loading ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">No results</td></tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp._id} className="group hover:bg-slate-50/50">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold overflow-hidden border border-slate-100 flex-shrink-0">
                                                    {emp.profilePicture ? (
                                                        <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        emp.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="truncate">
                                                    <div className="font-bold text-slate-900 truncate">{emp.name}</div>
                                                    <div className="text-[10px] text-slate-400 md:hidden">{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 hidden md:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail size={12} /> {emp.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone size={12} /> {emp.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-700">
                                                <BookOpen size={14} className="text-primary-500 flex-shrink-0" />
                                                <span className="truncate">{emp.qualification}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button onClick={() => navigate(`/employees/${emp._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
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
                                                <button onClick={() => handleDelete(emp._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
                    <div className="bg-white md:rounded-[24px] shadow-2xl w-full max-w-lg min-h-screen md:min-h-0 flex flex-col border border-slate-200">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 md:rounded-t-[24px]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#0B3C5D] text-white rounded-lg">
                                    <UserPlus size={20} />
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-[#0B3C5D]">
                                    {editingEmployee ? 'Edit' : 'Add'} Employee
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 pb-24 md:pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                                    <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none disabled:opacity-50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingEmployee} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Qualification</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Department</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required>
                                        <option value="">Select</option>
                                        {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Level</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none" value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })} required>
                                        <option value="">Select</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Mid">Mid</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6 sticky bottom-0 bg-white mt-auto">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeCRUD;
