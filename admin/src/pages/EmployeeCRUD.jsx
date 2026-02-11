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
    Plus,
    File
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
        address: ''
    });

    const [files, setFiles] = useState({
        tenth: null,
        twelfth: null,
        degree: null,
        offerletter: null,
        joiningletter: null,
        resume: null
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
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    formDataToSend.append(key, files[key]);
                }
            });

            if (editingEmployee) {
                await API.put(`/employees/${editingEmployee._id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await API.post('/employees', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            setEditingEmployee(null);
            setFormData({ name: '', email: '', phone: '', qualification: '', address: '' });
            setFiles({ tenth: null, twelfth: null, degree: null, offerletter: null, joiningletter: null, resume: null });
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
        } catch (err) {Files({ tenth: null, twelfth: null, degree: null, offerletter: null, joiningletter: null, resume: null });
                        set
            alert('Delete failed');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const buildFileUrl = (filePath) => {
        if (!filePath) return '';
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
        const baseUrl = (API?.defaults?.baseURL || '').replace(/\/api\/?$/, '');
        const normalized = filePath.replace(/\\/g, '/');
        const uploadsIndex = normalized.indexOf('uploads/');
        const relativePath = uploadsIndex >= 0 ? normalized.slice(uploadsIndex) : normalized.replace(/^\/+/, '');
        return `${baseUrl}/${relativePath}`;
    };

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
                        setFormData({ name: '', email: '', phone: '', qualification: '', address: '' });
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
                                                            address: emp.address || ''
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
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

                            <div>
                                <label className="label">Address</label>
                                <textarea
                                    className="input-field h-20 resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <File size={18} className="text-primary-600" />
                                    Documents
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'tenth', label: '10th Certificate' },
                                        { key: 'twelfth', label: '12th Certificate' },
                                        { key: 'degree', label: 'Degree Certificate' },
                                        { key: 'offerletter', label: 'Offer Letter' },
                                        { key: 'joiningletter', label: 'Joining Letter' },
                                        { key: 'resume', label: 'Resume' }
                                    ].map((doc) => (
                                        <div key={doc.key}>
                                            <label className="label">{doc.label}</label>
                                            <input
                                                type="file"
                                                className="input-field cursor-pointer"
                                                onChange={(e) => setFiles({ ...files, [doc.key]: e.target.files[0] })}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                            {editingEmployee?.documents?.[doc.key] && (
                                                <a
                                                    href={buildFileUrl(editingEmployee.documents[doc.key])}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-primary-600 mt-1 inline-block"
                                                >
                                                    View existing
                                                </a>
                                            )}
                                            {files[doc.key] && (
                                                <p className="text-sm text-primary-600 mt-1">
                                                    Selected: {files[doc.key].name}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
