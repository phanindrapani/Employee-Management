import React, { useState, useEffect } from 'react';
import API from '../api';
import { CalendarDays, CheckCircle2, Clock, XCircle, AlertCircle, Bookmark, ChevronRight, User } from 'lucide-react';
import StatCard from '../components/StatCard';
import ApplyLeaveModal from '../components/ApplyLeaveModal';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import useSocketListener from '../hooks/useSocketListener';

const Leaves = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useLocalStorage(`manager_leaves_list_${user?._id}`, []);
    const [myLeaves, setMyLeaves] = useLocalStorage(`manager_my_leaves_list_${user?._id}`, []);
    const [stats, setStats] = useLocalStorage(`manager_leaves_stats_${user?._id}`, []);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('oversight');
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [leaveRes, statsRes, myLeaveRes] = await Promise.all([
                API.get('/manager/leaves'),
                API.get('/manager/leaves/stats'),
                API.get('/manager/leaves/my-leaves')
            ]);
            setLeaves(leaveRes.data);
            setStats(statsRes.data);
            setMyLeaves(myLeaveRes.data);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useSocketListener('leave:created', fetchData);
    useSocketListener('leave:updated', fetchData);

    const handleLeaveAction = async (id, status) => {
        let rejectionReason = '';
        if (status === 'rejected') {
            rejectionReason = prompt("Please enter the reason for rejection:");
            if (!rejectionReason) return;
        }

        try {
            await API.put(`/manager/leaves/${id}/status`, { status, rejectionReason });
            fetchData();
        } catch (error) {
            console.error("Leave action error:", error);
            alert(error.response?.data?.message || "Failed to process leave request");
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-[#63C132]/10 text-[#63C132] border-[#63C132]/20';
            case 'pending': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'rejected': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-black tracking-widest uppercase text-[10px]">Syncing Leave Records...</div>;

    const totalRequests = stats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white shadow-2xl shadow-[#0B3C5D]/10 rounded-[28px] text-[#0B3C5D] border border-slate-50">
                        <CalendarDays size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-[#0B3C5D]">Leave Oversight</h1>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Resource availability & leave balance monitoring</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsApplyModalOpen(true)}
                        className="px-8 py-4 bg-[#0B3C5D] text-white rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-[#0B3C5D]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Apply Leave
                    </button>
                    <div className="bg-white px-8 py-4 rounded-[32px] shadow-sm border border-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none text-center">Total Team Requests</p>
                        <p className="text-2xl font-black text-[#0B3C5D] leading-none text-center">{totalRequests}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-2 rounded-[32px] border border-slate-50 shadow-sm w-fit">
                <button 
                    onClick={() => setActiveTab('oversight')}
                    className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'oversight' ? 'bg-[#0B3C5D] text-white shadow-xl shadow-[#0B3C5D]/20' : 'text-slate-400 hover:text-[#0B3C5D]'}`}
                >
                    Team Oversight
                </button>
                <button 
                    onClick={() => setActiveTab('my-leaves')}
                    className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my-leaves' ? 'bg-[#0B3C5D] text-white shadow-xl shadow-[#0B3C5D]/20' : 'text-slate-400 hover:text-[#0B3C5D]'}`}
                >
                    My Leaves
                </button>
            </div>

            {activeTab === 'oversight' ? (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Pending" value={stats.find(s => s._id === 'pending')?.count || 0} colorClass="border-amber-500" titleColor="text-amber-500" />
                        <StatCard title="Approved" value={stats.find(s => s._id === 'approved')?.count || 0} colorClass="border-green-500" titleColor="text-green-600" />
                        <StatCard title="Rejected" value={stats.find(s => s._id === 'rejected')?.count || 0} colorClass="border-rose-500" titleColor="text-rose-500" />
                    </div>

                    {/* Requests Feed */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest ml-1">Recent Activity</h3>
                        {leaves.length === 0 ? (
                            <div className="bg-white p-20 rounded-[48px] text-center border border-slate-50 shadow-sm">
                                <CalendarDays size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No leave activity recorded for your teams</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {leaves.map((leave) => (
                                    <div key={leave._id} className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-[#0B3C5D]/5 transition-all group">
                                        <div className="flex gap-5">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-14 h-14 rounded-[20px] bg-[#0B3C5D] flex items-center justify-center font-black text-lg text-white shadow-xl shadow-[#0B3C5D]/20">
                                                    {leave.user?.name?.charAt(0)}
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-black text-[#0B3C5D] leading-tight">{leave.user?.name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{leave.user?.department?.name || 'Engineering'}</p>
                                                    </div>
                                                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <span className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em]">{leave.leaveType || 'Personal'}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">From</p>
                                                        <p className="text-xs font-black text-[#0B3C5D] leading-none">{new Date(leave.fromDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">To</p>
                                                        <p className="text-xs font-black text-[#0B3C5D] leading-none">{new Date(leave.toDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed italic bg-slate-50/30 p-4 rounded-2xl mb-4">
                                                    "{leave.reason || 'No reason provided'}"
                                                </p>

                                                {leave.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleLeaveAction(leave._id, 'approved')}
                                                            className="flex-1 py-3 bg-[#63C132] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#52A428] transition-all shadow-lg shadow-[#63C132]/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleLeaveAction(leave._id, 'rejected')}
                                                            className="flex-1 py-3 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest ml-1">Personal History</h3>
                    {myLeaves.length === 0 ? (
                        <div className="bg-white p-20 rounded-[48px] text-center border border-slate-50 shadow-sm">
                            <CalendarDays size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">You haven't applied for any leaves yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {myLeaves.map((leave) => (
                                <div key={leave._id} className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-[#0B3C5D]/5 transition-all group">
                                    <div className="flex gap-5">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-14 h-14 rounded-[20px] ${leave.status === 'approved' ? 'bg-[#63C132]' : leave.status === 'rejected' ? 'bg-red-500' : 'bg-[#0B3C5D]'} flex items-center justify-center font-black text-lg text-white shadow-xl`}>
                                                {leave.leaveType?.charAt(0)}
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(leave.status)}`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-lg font-black text-[#0B3C5D] leading-tight">{leave.leaveType} Leave</h4>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.totalDays} Days</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-500">
                                                {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium italic border-t border-slate-50 pt-3">
                                                "{leave.reason}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isApplyModalOpen && (
                <ApplyLeaveModal 
                    onClose={() => setIsApplyModalOpen(false)} 
                    onSuccess={() => {
                        setIsApplyModalOpen(false);
                        fetchData();
                    }} 
                />
            )}
        </div>
    );
};

export default Leaves;
