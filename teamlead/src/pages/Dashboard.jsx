import React, { useState, useEffect } from 'react';
import {
    Users,
    ClipboardList,
    FolderKanban,
    CalendarClock,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import API from '../../api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        teamSize: 0,
        activeProjects: 0,
        pendingTasks: 0,
        onLeaveToday: 0,
        pendingApprovals: 0,
        weeklyProductivity: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await API.get('/team/stats');
                setStats(data);
                setLoading(false);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const cards = [
        { title: 'My Team', value: stats.teamSize, sub: 'Active Members', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Active Projects', value: stats.activeProjects, sub: 'Assigned to Team', icon: FolderKanban, color: 'text-[#63C132]', bg: 'bg-[#63C132]/10' },
        { title: 'Pending Tasks', value: stats.pendingTasks, sub: 'Action Required', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50' },
        { title: 'On Leave Today', value: stats.onLeaveToday, sub: 'Resource Availability', icon: CalendarClock, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-12 w-64 bg-slate-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white rounded-[32px] shadow-sm"></div>)}
            </div>
        </div>;
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Lead Dashboard</h1>
                    <p className="text-slate-500 font-medium">Control Center • Team Operational Overview</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#63C132] rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-slate-600">Live System Status</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`}></div>
                        <div className={`${card.bg} ${card.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                            <card.icon size={28} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{card.title}</h3>
                            <div className="text-3xl font-black text-[#0B3C5D] mb-1">{card.value}</div>
                            <p className="text-xs font-bold text-slate-400">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section: Summary & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Productivity Summary */}
                <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-[#63C132]" />
                            Weekly Productivity
                        </h3>
                        <span className="px-4 py-2 bg-[#63C132]/10 text-[#63C132] rounded-full text-xs font-black uppercase tracking-widest">
                            {stats.weeklyProductivity}% Efficiency
                        </span>
                    </div>

                    <div className="h-64 flex items-end gap-3 px-4">
                        {[45, 65, 85, 70, 95, 80, 85].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full bg-slate-50 rounded-2xl relative h-48 overflow-hidden">
                                    <div
                                        className="absolute bottom-0 left-0 w-full bg-[#0B3C5D] rounded-t-2xl transition-all duration-1000 group-hover:bg-[#63C132]"
                                        style={{ height: `${val}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Pending Approvals */}
                <div className="bg-[#0B3C5D] rounded-[40px] shadow-2xl p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                    <h3 className="text-xl font-black mb-10 tracking-tight flex items-center gap-3">
                        <CheckCircle2 className="text-[#63C132]" />
                        Lead Actions
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10 hover:bg-white/15 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#63C132]">Team Task</span>
                                <Clock size={16} className="text-white/40" />
                            </div>
                            <p className="text-sm font-bold group-hover:translate-x-1 transition-transform">Task Assignment Review</p>
                            <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-widest">{stats.pendingApprovals} Pending Approvals</p>
                        </div>

                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10 hover:bg-white/15 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#63C132]">System Alert</span>
                                <AlertCircle size={16} className="text-white/40" />
                            </div>
                            <p className="text-sm font-bold group-hover:translate-x-1 transition-transform">Project Deadline Warning</p>
                            <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-widest">2 Projects Ending Soon</p>
                        </div>

                        <button className="w-full py-4 bg-[#63C132] text-[#0B3C5D] rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.02] shadow-xl shadow-black/20 mt-4">
                            Assign New Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
