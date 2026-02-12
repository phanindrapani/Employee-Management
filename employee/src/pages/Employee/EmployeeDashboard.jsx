import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import {
    CalendarClock,
    Stethoscope,
    Plane,
    History,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><XCircle size={12} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
        }
    };

    const leaveBalance = user?.leaveBalance || { casual: 0, sick: 0, earned: 0 };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 font-medium italic">Your leave summary and balance</p>
                </div>
                <div className="px-4 py-2 bg-[#F0F7FF] rounded-xl text-[#0B3C5D] font-bold text-xs uppercase tracking-widest border border-[#0B3C5D]/10">
                    Employee Account
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Casual Leave"
                    value={leaveBalance.casual}
                    icon={CalendarClock}
                    colorClass="bg-[#F0F7FF] text-[#0B3C5D]"
                />
                <StatCard
                    title="Sick Leave"
                    value={leaveBalance.sick}
                    icon={Stethoscope}
                    colorClass="bg-[#FFF5F5] text-[#E53E3E]"
                />
                <StatCard
                    title="Earned Leave"
                    value={leaveBalance.earned}
                    icon={Plane}
                    colorClass="bg-[#F0FFF4] text-[#63C132]"
                />
                <StatCard
                    title="Pending Requests"
                    value={leaves.filter(l => l.status === 'pending').length}
                    icon={Clock}
                    colorClass="bg-[#FFFBEB] text-[#D97706]"
                />
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <History size={20} className="text-[#63C132]" />
                            Upcoming Leaves
                        </h3>
                    </div>
                    {leaves.filter(l => l.status === 'approved' && new Date(l.fromDate) >= new Date()).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 font-medium italic">
                            No upcoming approved leaves
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaves
                                .filter(l => l.status === 'approved' && new Date(l.fromDate) >= new Date())
                                .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))
                                .slice(0, 3)
                                .map(l => (
                                    <div key={l._id} className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-slate-100">
                                        <div>
                                            <div className="font-bold text-[#0B3C5D]">{l.leaveType}</div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-[#63C132]">{l.totalDays} Days</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{l.session}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8 overflow-hidden">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <History size={20} className="text-[#63C132]" />
                        Recent History
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-black tracking-[0.15em]">
                                    <th className="pb-6 px-4">Type</th>
                                    <th className="pb-6 px-4">Duration</th>
                                    <th className="pb-6 px-4">Days</th>
                                    <th className="pb-6 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-slate-400">Loading...</td></tr>
                                ) : leaves.length === 0 ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-slate-400">No records found</td></tr>
                                ) : (
                                    leaves.slice(0, 5).map((leave) => (
                                        <tr key={leave._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="py-6 px-4 font-bold text-[#0B3C5D] text-sm tracking-tight">{leave.leaveType}</td>
                                            <td className="py-6 px-4 text-xs font-bold text-slate-500 font-mono">
                                                {new Date(leave.fromDate).toLocaleDateString('en-GB')} <span className="text-slate-300 mx-1">→</span> {new Date(leave.toDate).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="py-6 px-4 text-lg font-black text-[#0B3C5D]">{leave.totalDays}</td>
                                            <td className="py-6 px-4">{getStatusBadge(leave.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
