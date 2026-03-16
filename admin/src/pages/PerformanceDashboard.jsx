import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    AlertCircle,
    Award,
    Clock,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
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

const ScorePill = ({ score }) => {
    const color = score >= 75 ? '#63C132' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
    );
};

const PerformanceDashboard = () => {
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('ls_admin_perf_stats');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!stats);
    const [calculating, setCalculating] = useState(false);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const date = new Date();
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const res = await API.get(`/admin/performance/dashboard?period=${period}`);
            setStats(res.data);
            localStorage.setItem('ls_admin_perf_stats', JSON.stringify(res.data));
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const date = new Date();
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            await API.post('/admin/performance/calculate', { period });
            await fetchStats();
        } catch (error) {
            console.error("Calculation failed", error);
        } finally {
            setCalculating(false);
        }
    };

    const toggleTeam = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="space-y-8 text-[#0B3C5D]">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Team Performance</h1>
                        <p className="text-slate-500 font-medium">Organisation-wide team analytics</p>
                    </div>
                </div>
                <button
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-colors disabled:opacity-50"
                >
                    {calculating ? <Clock size={20} className="animate-spin" /> : <TrendingUp size={20} />}
                    {calculating ? 'Calculating...' : 'Update Scores'}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold italic">
                    Loading Analytics...
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Teams</p>
                                <h3 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{stats?.summary?.totalTeams || 0}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-emerald-500 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Org Avg</p>
                                <h3 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{stats?.summary?.orgAvgScore || 0}%</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-amber-500 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Best Score</p>
                                <h3 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{stats?.summary?.highestIndividualScore || 0}%</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-rose-500 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Action Needed</p>
                                <h3 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{stats?.summary?.teamsNeedingAttention || 0}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Team Average Bar Chart */}
                    {stats?.teams?.length > 0 && (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50">
                            <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                                <TrendingUp size={20} /> Team Average Scores
                            </h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.teams.filter(t => t.teamId !== 'managers-virtual-id')} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="teamName" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value}%`, 'Avg Score']}
                                        />
                                        <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} barSize={36}>
                                            {stats.teams.map((t, i) => (
                                                <Cell key={i} fill={t.avgScore >= 75 ? '#63C132' : t.avgScore >= 50 ? '#f59e0b' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Manager Performance Bar Chart */}
                    {stats?.teams?.some(t => t.teamId === 'managers-virtual-id') && (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50">
                            <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                                <Award size={20} className="text-amber-500" /> Manager Performance Scores
                            </h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.teams.find(t => t.teamId === 'managers-virtual-id')?.members} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value}%`, 'Score']}
                                        />
                                        <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={36}>
                                            {stats.teams.find(t => t.teamId === 'managers-virtual-id')?.members.map((m, i) => (
                                                <Cell key={i} fill={m.score >= 75 ? '#63C132' : m.score >= 50 ? '#f59e0b' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Team Cards */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-[#0B3C5D] flex items-center gap-2">
                            <Users size={20} /> All Teams
                        </h3>
                        {stats?.teams?.length === 0 && (
                            <div className="text-center text-slate-400 py-12 font-medium italic">No team data available. Click "Update Scores" to calculate.</div>
                        )}
                        {stats?.teams?.filter(t => t.teamId !== 'managers-virtual-id').map((team, i) => (
                            <div key={i} className="bg-white rounded-[20px] shadow-sm border border-slate-50 overflow-hidden">
                                {/* Team Header Row */}
                                <div
                                    className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => toggleTeam(i)}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] text-white flex items-center justify-center font-black text-lg shrink-0">
                                        {team.teamName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-[#0B3C5D] text-lg">{team.teamName}</div>
                                        <div className="text-xs text-slate-400 font-bold">Lead: {team.leadName} · {team.membersCount} members</div>
                                    </div>
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <div className="text-center">
                                            <ScorePill score={team.avgScore} />
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Team Avg</div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-2xl font-black text-[#0B3C5D]">{team.highestScore}%</span>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Best Score</div>
                                        </div>
                                        {team.needsAttention > 0 && (
                                            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-black">
                                                {team.needsAttention} need attention
                                            </span>
                                        )}
                                        {expanded[i] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded member list */}
                                {expanded[i] && team.members?.length > 0 && (
                                    <div className="border-t border-slate-50 px-6 pb-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                                            {team.members.map((m, j) => (
                                                <div key={j} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center text-xs font-black">
                                                            {m.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-[#0B3C5D]">{m.name}</span>
                                                        {m.isLead && (
                                                            <span className="px-2 py-0.5 bg-[#63C132]/10 text-[#63C132] text-[9px] font-black uppercase tracking-widest rounded-full">Lead</span>
                                                        )}
                                                    </div>
                                                    <span className={`font-black text-sm ${m.score >= 75 ? 'text-[#63C132]' : m.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {m.score}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Top Performers sidebar */}
                    {stats?.topPerformers?.length > 0 && (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50">
                            <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                                <Award size={20} className="text-amber-500" /> Top Performers (All Teams)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.topPerformers.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center font-bold text-sm">
                                                {p.user?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#0B3C5D] text-sm">{p.user?.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{p.user?.role}</div>
                                            </div>
                                        </div>
                                        <ScorePill score={p.totalScore} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PerformanceDashboard;
