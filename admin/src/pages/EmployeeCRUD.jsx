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
    File,
    ClipboardList
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
        cl: 12,
        sl: 10,
        el: 15
    });

    const [files, setFiles] = useState({
        tenth: null,
        twelfth: null,
        degree: null,
        offerletter: null,
        joiningletter: null,
        resume: null,
        profilePicture: null
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
            setFormData({ name: '', email: '', phone: '', qualification: '', address: '', cl: 12, sl: 10, el: 15 });
            setFiles({ tenth: null, twelfth: null, degree: null, offerletter: null, joiningletter: null, resume: null, profilePicture: null });
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
                        setFormData({ name: '', email: '', phone: '', qualification: '', address: '', cl: 12, sl: 10, el: 15 });
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
                                                            cl: emp.leaveBalance?.cl || 0,
                                                            sl: emp.leaveBalance?.sl || 0,
                                                            el: emp.leaveBalance?.el || 0
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

                            <div>
                                <label className="label">Address</label>
                                <textarea
                                    className="input-field h-20 resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <ClipboardList size={18} className="text-primary-600" />
                                    Leave Balances
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label text-[10px]">Casual (CL)</label>
                                        <input
                                            type="number"
                                            className="input-field py-2"
                                            value={formData.cl}
                                            onChange={(e) => setFormData({ ...formData, cl: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-[10px]">Sick (SL)</label>
                                        <input
                                            type="number"
                                            className="input-field py-2"
                                            value={formData.sl}
                                            onChange={(e) => setFormData({ ...formData, sl: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-[10px]">Earned (EL)</label>
                                        <input
                                            type="number"
                                            className="input-field py-2"
                                            value={formData.el}
                                            onChange={(e) => setFormData({ ...formData, el: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <File size={18} className="text-primary-600" />
                                    Documents
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'profilePicture', label: 'Profile Picture' },
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
                                            {((doc.key === 'profilePicture' ? editingEmployee?.profilePicture : editingEmployee?.documents?.[doc.key])) && (
                                                <a
                                                    href={buildFileUrl(doc.key === 'profilePicture' ? editingEmployee.profilePicture : editingEmployee.documents[doc.key])}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-primary-600 mt-1 inline-block"
                                                    title={buildFileUrl(doc.key === 'profilePicture' ? editingEmployee.profilePicture : editingEmployee.documents[doc.key])}
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
