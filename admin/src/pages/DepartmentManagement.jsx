import React, { useState, useEffect } from 'react';
import API from '../api';
import { Building2, Plus, Trash2, X, Search } from 'lucide-react';

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const fetchDepartments = async () => {
        try {
            const { data } = await API.get('/admin/departments');
            setDepartments(data);
        } catch (err) {
            console.error('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/departments', formData);
            setShowModal(false);
            setFormData({ name: '', description: '' });
            fetchDepartments();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await API.delete(`/admin/departments/${id}`);
            fetchDepartments();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Departments</h1>
                        <p className="text-slate-500 font-medium">Manage organization structure</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <Plus size={20} />
                    Add Department
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">No departments found</div>
                ) : (
                    departments.map((dept) => (
                        <div key={dept._id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 text-[#0B3C5D] rounded-lg">
                                    <Building2 size={24} />
                                </div>
                                <button
                                    onClick={() => handleDelete(dept._id)}
                                    className="p-2 text-red-100 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{dept.name}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{dept.description || 'No description provided'}</p>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span>Created on</span>
                                <span>{new Date(dept.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[24px]">
                            <h2 className="text-xl font-bold text-[#0B3C5D]">Add Department</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Department Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Engineering, HR"
                                />
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the department"
                                ></textarea>
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

export default DepartmentManagement;
