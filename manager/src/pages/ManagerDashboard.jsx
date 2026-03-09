import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Users,
    Target,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Briefcase
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className="card group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-[0.03] rounded-full transition-all duration-700 group-hover:scale-150 group-hover:opacity-[0.08]`} style={{ backgroundColor: color }}></div>
        <div className="flex items-start justify-between mb-6 relative z-10">
            <div className={`p-4 rounded-2xl shadow-lg`} style={{ backgroundColor: `${color}15`, color }}>
                <Icon size={24} className="group-hover:rotate-12 transition-transform duration-500" />
            </div>
            {change && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {change}
                </div>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0B3C5D]">{value}</span>
            </div>
        </div>
    </div>
);

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        managedTeams: 0,
        totalEmployees: 0,
        avgTeamPerformance: 0,
        activeProjects: 0
    });
    const [performanceData, setPerformanceData] = useState([]);
    const [topLeads, setTopLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const now = new Date();
                const currentPeriod = now.toISOString().slice(0, 7);
                const res = await API.get(`/manager/performance/dashboard?period=${currentPeriod}`);

                const { summary, performanceTrend, topLeads } = res.data;

                setStats({
                    managedTeams: summary.totalTeams || 0,
                    totalEmployees: summary.totalEmployees || 0,
                    avgTeamPerformance: summary.orgAvgScore || 0,
                    activeProjects: summary.activeProjects || 0
                });

                setPerformanceData(performanceTrend || []);
                setTopLeads(topLeads || []);
            } catch (err) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#0B3C5D] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Manager Overview</h1>
                <p className="text-slate-500 font-medium">Strategic performance tracking and team oversight.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Supervised Teams" value={stats.managedTeams} icon={Users} color="#0B3C5D" />
                <StatCard title="Direct Reports" value={stats.totalEmployees} icon={Users} color="#63C132" />
                <StatCard title="Avg. Performance" value={`${stats.avgTeamPerformance.toFixed(1)}%`} icon={TrendingUp} color="#F59E0B" />
                <StatCard title="Active Projects" value={stats.activeProjects} icon={Briefcase} color="#EF4444" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Organizational Performance</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Aggregated Team Metrics</p>
                        </div>
                        <select className="bg-slate-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none focus:ring-2 focus:ring-[#0B3C5D]/10 tracking-widest uppercase">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0B3C5D" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0B3C5D" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#0B3C5D"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Leads Quick View */}
                <div className="card">
                    <h3 className="text-xl font-bold mb-6">Top Reporting Leads</h3>
                    <div className="space-y-6">
                        {topLeads.length > 0 ? topLeads.map((lead, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-[#0B3C5D] border border-slate-100 group-hover:bg-[#0B3C5D] group-hover:text-white transition-all duration-300">
                                    {lead.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{lead.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lead.team}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="bg-[#63C132] h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${lead.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400">{lead.score}%</span>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-400 font-bold text-center py-8 italic uppercase tracking-widest">No reporting data available</p>
                        )}
                    </div>
                    <button className="w-full py-4 bg-slate-50 text-[#0B3C5D] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mt-8 hover:bg-slate-100 transition-colors">
                        View All Reporting Lines
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
