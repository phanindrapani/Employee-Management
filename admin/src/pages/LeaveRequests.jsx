import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    ClipboardList,
    CheckCircle,
    XCircle,
    MessageSquare,
    Search,
    Filter
} from 'lucide-react';

const LeaveRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await API.get(`/leaves/all?status=${statusFilter}`);
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleAction = async (id, status) => {
        if (status === 'rejected' && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await API.put(`/leaves/${id}/status`, { status, rejectionReason });
            setRejectionReason('');
            setSelectedId(null);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
                        <p className="text-slate-500 text-sm">Review and manage employee leave applications</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="">All Statuses</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                                <th className="pb-4 font-semibold">Employee</th>
                                <th className="pb-4 font-semibold">Leave Type</th>
                                <th className="pb-4 font-semibold">Duration</th>
                                <th className="pb-4 font-semibold">Days</th>
                                <th className="pb-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400">Loading requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400">No {statusFilter} requests found</td></tr>
                            ) : (
                                requests.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium text-xs">
                                                    {leave.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{leave.user.name}</p>
                                                    <p className="text-xs text-slate-400">{leave.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">
                                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 font-semibold text-slate-700">{leave.totalDays}</td>
                                        <td className="py-4">
                                            {leave.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    {selectedId === leave._id ? (
                                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Rejection reason..."
                                                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleAction(leave._id, 'rejected')}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Confirm Rejection"
                                                            >
                                                                <CheckCircle size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedId(null)}
                                                                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                                                            >
                                                                <XCircle size={20} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(leave._id, 'approved')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                <CheckCircle size={16} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedId(leave._id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                <XCircle size={16} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
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
