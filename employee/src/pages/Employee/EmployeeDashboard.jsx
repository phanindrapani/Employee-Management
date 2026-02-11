import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import ApplyLeaveForm from '../../components/ApplyLeaveForm';
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Casual Leave"
                    value={user.leaveBalance.casual}
                    icon={CalendarClock}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard
                    title="Sick Leave"
                    value={user.leaveBalance.sick}
                    icon={Stethoscope}
                    colorClass="bg-red-100 text-red-600"
                />
                <StatCard
                    title="Earned Leave"
                    value={user.leaveBalance.earned}
                    icon={Plane}
                    colorClass="bg-green-100 text-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ApplyLeaveForm onLeaveApplied={fetchLeaves} />
                </div>

                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <div className="flex items-center gap-2 mb-6 text-primary-600">
                            <History size={20} />
                            <h3 className="text-lg font-semibold text-slate-900">Leave History</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 font-semibold text-slate-600 text-sm">Type</th>
                                        <th className="pb-4 font-semibold text-slate-600 text-sm">Duration</th>
                                        <th className="pb-4 font-semibold text-slate-600 text-sm">Days</th>
                                        <th className="pb-4 font-semibold text-slate-600 text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">Loading history...</td></tr>
                                    ) : leaves.length === 0 ? (
                                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">No leave records found</td></tr>
                                    ) : (
                                        leaves.map((leave) => (
                                            <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 font-medium text-slate-900">{leave.leaveType}</td>
                                                <td className="py-4 text-sm text-slate-500">
                                                    {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{leave.session}</div>
                                                </td>
                                                <td className="py-4 text-sm text-slate-700 font-semibold">{leave.totalDays}</td>
                                                <td className="py-4">{getStatusBadge(leave.status)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
