import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Info,
    ArrowRight
} from 'lucide-react';
import API from '../../api';

const LeaveOverview = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamLeaves = async () => {
            try {
                const { data } = await API.get('/team/leaves');
                setLeaves(data);
                setLoading(false);
            } catch (error) {
                console.error("Fetch leaves error:", error);
                setLoading(false);
            }
        };
        fetchTeamLeaves();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-[#63C132]/10 text-[#63C132]';
            case 'pending': return 'bg-amber-50 text-amber-600';
            case 'rejected': return 'bg-rose-50 text-rose-600';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    if (loading) return <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-white rounded-[40px]"></div>
        <div className="h-96 bg-white rounded-[40px]"></div>
    </div>;

    const stats = {
        totalRequests: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Leave Intelligence</h1>
                    <p className="text-slate-500 font-medium">Resource Management • Team Availability & Absence Tracking</p>
                </div>
            </div>

            {/* Quick Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Requests</div>
                        <div className="text-3xl font-black text-[#0B3C5D]">{stats.totalRequests}</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <CalendarDays size={24} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved Cases</div>
                        <div className="text-3xl font-black text-[#63C132]">{stats.approved}</div>
                    </div>
                    <div className="w-12 h-12 bg-[#63C132]/10 text-[#63C132] rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Sync</div>
                        <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Leave History Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight">Recent Leave Logs</h3>
                    <div className="flex gap-2">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                            Resource Flow
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Date</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Integrity Status</th>
                                <th className="px-10 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leaves.length > 0 ? leaves.map((leave) => (
                                <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-[11px] font-black text-[#0B3C5D]">
                                                {leave.user?.name?.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#0B3C5D]">{leave.user?.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{leave.leaveType}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="text-sm font-semibold text-slate-500 flex flex-col">
                                            <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <ArrowRight size={10} /> {new Date(leave.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="text-sm font-medium text-slate-400">
                                            {new Date(leave.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-sm">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-[#0B3C5D] transition-colors">
                                            <Info size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-10 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                        No team leaves records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveOverview;
