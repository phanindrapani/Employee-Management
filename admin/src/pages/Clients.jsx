import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import {
    Users, Search, Edit2,
    Trash2, Mail, Phone, Building2, X, UserPlus, FileText
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Clients = () => {
    const initialFormData = {
        name: '',
        email: '',
        phone: '',
        company: ''
    };

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const { showToast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const { data } = await API.get('/admin/clients');
            setClients(data);
        } catch (err) {
            showToast('Failed to fetch clients', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            if (editingClient) {
                await API.put(`/admin/clients/${editingClient._id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Client updated successfully', 'success');
            } else {
                await API.post('/admin/clients', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Client added successfully', 'success');
            }
            setShowModal(false);
            setEditingClient(null);
            setFormData(initialFormData);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await API.delete(`/admin/clients/${id}`);
            showToast('Client deleted successfully', 'success');
            fetchData();
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 md:space-y-8 text-[#0B3C5D]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Building2 size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Clients</h1>
                        <p className="text-xs md:text-base text-slate-500 font-medium italic">Manage client directory</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingClient(null);
                        setFormData(initialFormData);
                        setShowModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#63C132] text-white rounded-xl font-bold hover:bg-[#52A428] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#63C132]/20"
                >
                    <UserPlus size={20} />
                    <span>Add Client</span>
                </button>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-slate-50 p-4 md:p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="Search name, email, or company..."
                        className="w-full pl-12 pr-4 py-3 md:py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all font-medium text-slate-600 text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] md:text-[11px] uppercase font-black tracking-widest">
                                <th className="pb-4 px-2">Client</th>
                                <th className="pb-4 px-2 hidden md:table-cell">Contact</th>
                                <th className="pb-4 px-2">Company info</th>
                                <th className="pb-4 px-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {loading ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-400">No results</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client._id} className="group hover:bg-slate-50/50">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold overflow-hidden border border-slate-100 flex-shrink-0">
                                                    {client.profilePicture ? (
                                                        <img src={client.profilePicture} alt={client.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        client.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="truncate">
                                                    <div className="font-bold text-slate-900 truncate">{client.name}</div>
                                                    <div className="text-[10px] text-slate-400 md:hidden">{client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 hidden md:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail size={12} /> {client.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone size={12} /> {client.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    <Building2 size={12} className="text-indigo-400 flex-shrink-0" />
                                                    <span className="truncate">{client.company || <span className="text-slate-300 italic">Not set</span>}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black tracking-widest uppercase">
                                                        {client.clientCode}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingClient(client);
                                                        setFormData({
                                                            name: client.name,
                                                            email: client.email,
                                                            phone: client.phone || '',
                                                            company: client.company || ''
                                                        });
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit Client"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Client"
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

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0B3C5D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
                    <div className="bg-white md:rounded-[24px] shadow-2xl w-full max-w-lg min-h-screen md:min-h-0 flex flex-col border border-slate-200">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 md:rounded-t-[24px]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#0B3C5D] text-white rounded-lg">
                                    <Building2 size={20} />
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-[#0B3C5D]">
                                    {editingClient ? 'Edit' : 'Add'} Client
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 pb-24 md:pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none disabled:opacity-50"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={!!editingClient}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 sticky bottom-0 bg-white mt-auto">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-[#0B3C5D] text-white hover:bg-[#1A4B6D] shadow-lg shadow-indigo-100 rounded-xl font-bold transition-all">
                                    {editingClient ? 'Update Client' : 'Save Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
