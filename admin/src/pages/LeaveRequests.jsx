import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    ClipboardList,
    CheckCircle,
    XCircle,
    MessageSquare,
    Search,
    Filter,
    FileText
} from 'lucide-react';

const LeaveRequests = () => {
    const [leaves, setLeaves] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/admin/leaves');
            setLeaves(data);
        } catch (err) {
            console.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (statusFilter === '') {
            setFilteredLeaves(leaves);
        } else {
            setFilteredLeaves(leaves.filter(l => l.status === statusFilter));
        }
    }, [leaves, statusFilter]);

    const stats = {
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        total: leaves.length
    };

    const handleAction = async (id, status) => {
        if (status === 'rejected' && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await API.put(`/admin/leaves/${id}`, { status, rejectionReason });
            setRejectionReason('');
            setSelectedId(null);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                    <ClipboardList size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Leave Requests</h1>
                    <p className="text-slate-500 font-medium italic">Check and manage employee leaves</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#FFFBEB] p-6 rounded-[24px] border border-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{stats.pending}</h3>
                    </div>
                    <div className="p-3 bg-white/50 rounded-xl">
                        <Filter className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-[#F0FFF4] p-6 rounded-[24px] border border-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#63C132] mb-1">Approved Leaves</p>
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{stats.approved}</h3>
                    </div>
                    <div className="p-3 bg-white/50 rounded-xl">
                        <CheckCircle className="text-[#63C132]" />
                    </div>
                </div>
                <div className="bg-[#FEF2F2] p-6 rounded-[24px] border border-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Rejected Leaves</p>
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{stats.rejected}</h3>
                    </div>
                    <div className="p-3 bg-white/50 rounded-xl">
                        <XCircle className="text-red-500" />
                    </div>
                </div>
                <div className="bg-[#F0F7FF] p-6 rounded-[24px] border border-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0B3C5D] mb-1">Total Requests</p>
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{stats.total}</h3>
                    </div>
                    <div className="p-3 bg-white/50 rounded-xl">
                        <ClipboardList className="text-[#0B3C5D]" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-xl font-black text-[#0B3C5D]">Request List</h2>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#0B3C5D] transition-colors" />
                        <select
                            className="bg-white border-none text-[#0B3C5D] font-bold text-sm pl-12 pr-10 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all appearance-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#0B3C5D]/10"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved Only</option>
                            <option value="rejected">Rejected Only</option>
                            <option value="">Show All</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-black tracking-[0.15em]">
                                <th className="pb-6 px-4">Employee</th>
                                <th className="pb-6 px-4">Leave Type</th>
                                <th className="pb-6 px-4">Dates</th>
                                <th className="pb-6 px-4">Days</th>
                                <th className="pb-6 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400">Loading requests...</td></tr>
                            ) : filteredLeaves.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400">No requests found</td></tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#0B3C5D] text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-[#0B3C5D]/10">
                                                    {leave.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0B3C5D] text-sm tracking-tight">{leave.user?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">{leave.user?.email ? leave.user.email.split('@')[0] : ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="px-3 py-1 bg-[#F4F6F9] text-[#0B3C5D] rounded-full text-[10px] font-black uppercase tracking-wider border border-[#0B3C5D]/5">
                                                {leave.leaveType}
                                            </span>
                                            {leave.attachment && (
                                                <a
                                                    href={leave.attachment}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block mt-2 text-[10px] text-primary-600 font-bold hover:underline flex items-center gap-1"
                                                >
                                                    <FileText size={10} /> View Attachment
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-6 px-4 text-xs font-bold text-slate-500 font-mono">
                                            {new Date(leave.fromDate).toLocaleDateString('en-GB')} <span className="text-slate-300 mx-1">→</span> {new Date(leave.toDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="text-lg font-black text-[#0B3C5D]">{leave.totalDays}</span>
                                            <span className="text-[10px] text-slate-400 font-black ml-1 uppercase">Unit(s)</span>
                                        </td>
                                        <td className="py-6 px-4">
                                            {leave.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-3">
                                                    {selectedId === leave._id ? (
                                                        <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                                                            <input
                                                                type="text"
                                                                placeholder="Rejection reason..."
                                                                className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-red-500/10 placeholder:text-slate-300"
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleAction(leave._id, 'rejected')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Confirm Reject"
                                                            >
                                                                <CheckCircle size={22} />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedId(null)}
                                                                className="p-2 text-slate-300 hover:bg-slate-50 rounded-xl transition-all"
                                                            >
                                                                <XCircle size={22} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(leave._id, 'approved')}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-[#63C132] text-white hover:bg-[#52A428] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#63C132]/20 active:scale-95"
                                                            >
                                                                <CheckCircle size={16} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedId(leave._id)}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 hover:bg-red-50 border border-red-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                                            >
                                                                <XCircle size={16} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${leave.status === 'approved'
                                                        ? 'bg-[#F0FFF4] text-[#63C132] border-[#63C132]/20'
                                                        : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequests;
