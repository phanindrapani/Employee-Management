import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
    History,
    Filter,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';

const LeaveHistory = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchLeaves = async () => {
        try {
            const { data } = await API.get('/leaves');
            setLeaves(data);
        } catch (err) {
            console.error('Failed to fetch leaves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const filteredLeaves = leaves.filter(leave =>
        filterStatus === 'all' ? true : leave.status === filterStatus
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-[#F0FFF4] text-[#63C132] rounded-full text-[10px] font-black uppercase tracking-wider border border-[#63C132]/10 flex items-center gap-1.5 w-fit"><CheckCircle2 size={12} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-1.5 w-fit"><XCircle size={12} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-1.5 w-fit"><Clock size={12} /> Pending</span>;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                        <History size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Leave History</h1>
                        <p className="text-slate-500 font-medium italic">View and track your previous applications</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#0B3C5D] transition-colors" />
                        <select
                            className="bg-white border-none text-[#0B3C5D] font-bold text-sm pl-11 pr-10 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all appearance-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#0B3C5D]/10"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-black tracking-[0.15em]">
                                <th className="pb-6 px-4">Leave Type</th>
                                <th className="pb-6 px-4">Duration</th>
                                <th className="pb-6 px-4">Days</th>
                                <th className="pb-6 px-4">Status</th>
                                <th className="pb-6 px-4">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading history...</td></tr>
                            ) : filteredLeaves.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found</td></tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="py-6 px-4">
                                            <span className="font-bold text-[#0B3C5D] text-sm tracking-tight">{leave.leaveType}</span>
                                            <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">{leave.session.replace('-', ' ')}</p>
                                        </td>
                                        <td className="py-6 px-4 text-xs font-bold text-slate-500 font-mono">
                                            {new Date(leave.fromDate).toLocaleDateString('en-GB')} <span className="text-slate-300 mx-1">→</span> {new Date(leave.toDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="text-lg font-black text-[#0B3C5D]">{leave.totalDays}</span>
                                            <span className="text-[10px] text-slate-400 font-black ml-1 uppercase">Day(s)</span>
                                        </td>
                                        <td className="py-6 px-4">
                                            {getStatusBadge(leave.status)}
                                            {leave.rejectionReason && (
                                                <p className="text-[10px] text-red-500 font-bold italic mt-1 max-w-[150px]">
                                                    {leave.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-6 px-4 text-sm text-slate-500 max-w-xs truncate font-medium italic">
                                            {leave.reason || 'N/A'}
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

export default LeaveHistory;
