import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import {
    Users,
    Target,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Briefcase,
    Ticket,
    Calendar,
    AlertCircle,
    Activity,
    ChevronRight,
    ArrowUpRight,
    UserMinus,
    LayoutDashboard,
    ClipboardList
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

const ManagerDashboard = () => {
    const [stats, setStats] = useLocalStorage('manager_dashboard_stats', null);
    const [loading, setLoading] = useState(!stats);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const { data } = await API.get('/manager/dashboard/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    }, [setStats]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-[#0B3C5D] font-black italic tracking-widest text-xs uppercase animate-pulse">
                Assembling Strategic Intelligence...
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[#0B3C5D] mb-1">Strategic Dashboard</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">High-Level Organizational Oversight</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchDashboardStats} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <Activity size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* 1️⃣ Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Link to="/manager/teams">
                    <StatCard title="Teams" value={stats?.summaryKPIs?.teams || 0} colorClass="border-blue-500" titleColor="text-blue-500" />
                </Link>
                <Link to="/manager/projects">
                    <StatCard title="Projects" value={stats?.summaryKPIs?.projects || 0} colorClass="border-indigo-500" titleColor="text-indigo-500" />
                </Link>
                <StatCard title="Employees" value={stats?.summaryKPIs?.employees || 0} colorClass="border-slate-400" titleColor="text-slate-400" />
                <Link to="/manager/tasks">
                    <StatCard title="Tasks" value={stats?.summaryKPIs?.tasks || 0} colorClass="border-green-500" titleColor="text-green-600" />
                </Link>
                <Link to="/manager/tickets">
                    <StatCard title="Tickets" value={stats?.summaryKPIs?.tickets || 0} colorClass="border-amber-500" titleColor="text-amber-500" />
                </Link>
                <StatCard title="Overdue" value={stats?.summaryKPIs?.overdue || 0} colorClass="border-rose-500" titleColor="text-rose-500" />
            </div>

            {/* 2️⃣ Project Health Overview */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={18} className="text-indigo-500" /> Project Health
                    </h3>
                    <Link to="/projects" className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:underline">
                        Full Portfolio <ChevronRight size={12} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-4">Project</th>
                                <th className="px-8 py-4">Team</th>
                                <th className="px-8 py-4">Progress</th>
                                <th className="px-8 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-[#0B3C5D]">
                            {stats?.projectHealth?.map((proj, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 font-black">{proj.name}</td>
                                    <td className="px-8 py-4 text-slate-400 uppercase text-[10px]">{proj.team}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${proj.progress > 70 ? 'bg-green-500' : proj.progress > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${proj.progress}%` }}
                                                />
                                            </div>
                                            <span className="w-8 text-right font-black">{proj.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${proj.status === 'Good' ? 'bg-green-100 text-green-600' :
                                            proj.status === 'At Risk' ? 'bg-amber-100 text-amber-600' :
                                                'bg-rose-100 text-rose-600'
                                            }`}>
                                            {proj.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 4️⃣ Ticket Overview & 6️⃣ Employee Availability */}
                <div className="space-y-8">
                    {/* Ticket Pulse */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2">
                                <Ticket size={18} className="text-amber-500" /> Ticket Pulse
                            </h3>
                            <Link to="/manager/tickets" className="p-2 hover:bg-slate-50 rounded-lg">
                                <ArrowUpRight size={16} className="text-slate-300" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Open</p>
                                <p className="text-2xl font-black text-[#0B3C5D]">{stats?.ticketPulse?.open}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                                <p className="text-2xl font-black text-[#0B3C5D]">{stats?.ticketPulse?.inProgress}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Waiting</p>
                                <p className="text-2xl font-black text-amber-600">{stats?.ticketPulse?.waiting}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolved Today</p>
                                <p className="text-2xl font-black text-green-600">{stats?.ticketPulse?.resolvedToday}</p>
                            </div>
                        </div>
                    </div>

                    {/* Employee availability */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
                        <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2 mb-8">
                            <UserMinus size={18} className="text-rose-500" /> Availability
                        </h3>
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex-1">
                                <p className="text-3xl font-black text-rose-500">{stats?.leaveStats?.onLeaveToday}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On Leave Today</p>
                            </div>
                            <div className="w-[1px] h-10 bg-slate-100" />
                            <div className="flex-1">
                                <p className="text-3xl font-black text-[#0B3C5D]">{stats?.leaveStats?.upcomingLeave}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next 7 Days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7️⃣ Alerts & Risks */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-50 bg-rose-50/20">
                        <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={18} /> Strategic Risks
                        </h3>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                        {stats?.alerts?.length > 0 ? stats.alerts.map((alert, i) => (
                            <div key={i} className={`p-4 rounded-2xl flex items-start gap-3 border ${alert.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                                }`}>
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p className="text-xs font-bold leading-relaxed tracking-tight">{alert.message}</p>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 size={32} className="text-green-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">All Systems Stable</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 8️⃣ Recent Activity Feed */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-lg font-black text-[#0B3C5D] flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" /> Activity Stream
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Live Operational Monitoring</p>
                    </div>
                    <LayoutDashboard className="text-slate-50" size={48} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative before:absolute before:left-0 md:before:left-1/2 before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-50 before:hidden md:before:block">
                    {stats?.recentActivity?.map((act, i) => (
                        <div key={i} className="flex items-start gap-6 group">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#0B3C5D] group-hover:bg-[#0B3C5D] group-hover:text-white transition-all">
                                {act.assignedTo?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[11px] font-black text-[#0B3C5D] tracking-tight truncate">
                                        {act.assignedTo?.name} <span className="text-slate-400 font-bold">updated</span>
                                    </p>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase shrink-0">{new Date(act.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs font-black text-indigo-500 truncate mb-1">"{act.title}"</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest ${act.status === 'done' ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {act.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
