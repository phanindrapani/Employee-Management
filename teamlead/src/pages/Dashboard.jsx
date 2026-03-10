import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import useSocketListener from '../hooks/useSocketListener';
import StatCard from '../components/StatCard';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(() => {
        const defaultValue = {
            teamSize: 0,
            activeProjects: 0,
            pendingTasks: 0,
            onLeaveToday: 0,
            pendingApprovals: 0,
            weeklyProductivity: 0,
            productivityTrend: [],
            alerts: []
        };
        const cached = localStorage.getItem('ls_tl_stats');
        return cached ? { ...defaultValue, ...JSON.parse(cached) } : defaultValue;
    });
    const [loading, setLoading] = useState(!stats.teamSize && !stats.activeProjects);

    const fetchDashboardData = useCallback(async () => {
        try {
            const { data } = await API.get('/team-lead/stats');
            setStats(data);
            localStorage.setItem('ls_tl_stats', JSON.stringify(data));
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useSocketListener('task:created', fetchDashboardData);
    useSocketListener('task:updated', fetchDashboardData);
    useSocketListener('task:assigned', fetchDashboardData);
    useSocketListener('task:deleted', fetchDashboardData);
    useSocketListener('leave:created', fetchDashboardData);
    useSocketListener('leave:updated', fetchDashboardData);
    useSocketListener('project:created', fetchDashboardData);
    useSocketListener('project:updated', fetchDashboardData);
    useSocketListener('project:deleted', fetchDashboardData);
    useSocketListener('performance:updated', fetchDashboardData);

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-12 w-64 bg-slate-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl shadow-sm"></div>)}
            </div>
        </div>;
    }

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Lead Dashboard</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium italic">Control Center • Team Operational Overview</p>
                </div>
                <div className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 w-fit">
                    <div className="w-2 h-2 bg-[#63C132] rounded-full animate-pulse"></div>
                    <span className="text-[10px] md:text-sm font-bold text-slate-600 uppercase tracking-widest">Live System Status</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="My Team" value={stats.teamSize} colorClass="border-blue-500" titleColor="text-blue-500" onClick={() => navigate('/team')} />
                <StatCard title="Active Projects" value={stats.activeProjects} colorClass="border-green-500" titleColor="text-green-600" onClick={() => navigate('/projects')} />
                <StatCard title="Pending Tasks" value={stats.pendingTasks} colorClass="border-amber-500" titleColor="text-amber-500" onClick={() => navigate('/tasks')} />
                <StatCard title="On Leave Today" value={stats.onLeaveToday} colorClass="border-rose-500" titleColor="text-rose-500" onClick={() => navigate('/leaves')} />
            </div>

            {/* Bottom Section: Summary & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Productivity Summary */}
                <div className="lg:col-span-2 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <h3 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-[#63C132]" />
                            Weekly Productivity
                        </h3>
                        <span className="px-3 py-1.5 bg-[#63C132]/10 text-[#63C132] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#63C132]/20">
                            {stats.weeklyProductivity}% Efficiency
                        </span>
                    </div>

                    <div className="flex-1 min-h-[250px] md:min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.productivityTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#0B3C5D', fontWeight: 900, fontSize: '12px' }}
                                    labelStyle={{ display: 'none' }}
                                    formatter={(value) => [`${value}% Productivity`, '']}
                                />
                                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={32}>
                                    {stats?.productivityTrend?.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.value > 70 ? '#0B3C5D' : '#63C132'}
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lead Actions / Dynamic Alerts */}
                <div className="bg-[#0B3C5D] rounded-[32px] md:rounded-[40px] shadow-2xl p-8 md:p-10 text-white relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                    <h3 className="text-xl font-black mb-8 md:mb-10 tracking-tight flex items-center gap-3 !text-white">
                        <CheckCircle2 className="text-[#63C132]" />
                        Lead Actions
                    </h3>

                    <div className="space-y-4 md:space-y-6 relative z-10 flex-1">
                        {stats.alerts && stats.alerts.length > 0 ? (
                            stats.alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 md:p-6 bg-white/10 rounded-2xl md:rounded-3xl border border-white/10 hover:bg-white/15 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${alert.severity === 'warning' ? 'text-amber-400' :
                                            alert.severity === 'info' ? 'text-blue-400' : 'text-[#63C132]'
                                            }`}>
                                            {alert.type} Alert
                                        </span>
                                        {alert.severity === 'warning' ? <AlertCircle size={14} className="text-amber-400" /> : <Clock size={14} className="text-white/40" />}
                                    </div>
                                    <p className="text-xs md:text-sm font-bold group-hover:translate-x-1 transition-transform leading-tight">{alert.message}</p>
                                    <p className="text-[8px] md:text-[10px] text-white/50 mt-1 uppercase font-bold tracking-widest">Action Recommended</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 md:p-10 border-2 border-dashed border-white/10 rounded-[28px] md:rounded-[32px] text-center">
                                <CheckCircle2 className="mx-auto text-white/10 mb-4 size-8 md:size-10" />
                                <p className="text-[10px] md:text-xs font-bold text-white/30 uppercase tracking-widest">Systems Optimal</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/tasks')}
                        className="w-full py-4 mt-6 bg-[#63C132] text-[#0B3C5D] rounded-xl md:rounded-[22px] font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.02] shadow-xl shadow-black/20"
                    >
                        Review All Tasks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
