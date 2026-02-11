import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Users,
    UserPlus,
    Search,
    Mail,
    Phone,
    BookOpen,
    Trash2,
    Edit2,
    FileText,
    X,
    Plus
} from 'lucide-react';

const EmployeeCRUD = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        qualification: '',
        address: '',
        password: ''
    });

    const fetchEmployees = async () => {
        try {
            const { data } = await API.get('/employees');
            setEmployees(data);
        } catch (err) {
            console.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await API.put(`/employees/${editingEmployee._id}`, formData);
            } else {
                await API.post('/auth/register', { ...formData, role: 'employee' });
            }
            setShowModal(false);
            setEditingEmployee(null);
            setFormData({ name: '', email: '', phone: '', qualification: '', address: '', password: '' });
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await API.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-primary-600" />
                        Employee Management
                    </h1>
                    <p className="text-slate-500 text-sm">Create, edit and manage employee records</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setFormData({ name: '', email: '', phone: '', qualification: '', address: '', password: 'password123' });
                        setShowModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Add Employee
                </button>
            </div>

            <div className="card">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                                <th className="pb-4 font-semibold">Employee</th>
                                <th className="pb-4 font-semibold">Contact</th>
                                <th className="pb-4 font-semibold">Qualification</th>
                                <th className="pb-4 font-semibold text-right">Actions</th>
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
                                                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                                    {emp.name.charAt(0)}
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
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingEmployee(emp);
                                                        setFormData({
                                                            name: emp.name,
                                                            email: emp.email,
                                                            phone: emp.phone,
                                                            qualification: emp.qualification,
                                                            address: emp.address || '',
                                                            password: ''
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                            {!editingEmployee && (
                                <div>
                                    <label className="label">Default Password</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="label">Address</label>
                                <textarea
                                    className="input-field h-20 resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
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
