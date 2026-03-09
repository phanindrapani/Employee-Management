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
    ChevronUp,
    Target
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

const TeamPerformance = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const date = new Date();
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const res = await API.get(`/manager/performance/dashboard?period=${period}`);
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch manager dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTeam = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#0B3C5D] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Target size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Supervised Performance</h1>
                        <p className="text-slate-500 font-medium">Real-time oversight of your reporting teams and leads.</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.totalTeams || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Managed Teams</div>
                </div>
                <div className="card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Avg</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.orgAvgScore || 0}%</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Teams Average Score</div>
                </div>
                <div className="card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Peak</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.highestTeamAvg || 0}%</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Highest Team Average</div>
                </div>
                <div className="card border-rose-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Alert</span>
                    </div>
                    <div className="text-3xl font-black text-[#EF4444]">{stats?.summary?.teamsNeedingAttention || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Teams Needing Focus</div>
                </div>
            </div>

            {/* Detailed View */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 px-2">
                    <LayoutDashboard size={20} className="text-[#0B3C5D]" /> Detailed Team Overview
                </h3>
                {stats?.teams?.length === 0 && (
                    <div className="card text-center text-slate-400 py-16 font-medium italic">
                        No team oversight data found. Ensure teams are assigned to you in Team Management.
                    </div>
                )}
                {stats?.teams?.map((team, i) => (
                    <div key={i} className="card p-0 overflow-hidden border-slate-100/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div
                            className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                            onClick={() => toggleTeam(i)}
                        >
                            <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#0B3C5D] to-[#1A4B6D] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#0B3C5D]/20 shrink-0">
                                {team.teamName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-[#0B3C5D] text-2xl tracking-tight">{team.teamName}</div>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lead: {team.leadName}</span>
                                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{team.membersCount} Specialists</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-10 flex-wrap">
                                <div className="text-center">
                                    <ScorePill score={team.avgScore} />
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Team Health</div>
                                </div>
                                <div className="text-center hidden sm:block">
                                    <span className="text-2xl font-black text-[#0B3C5D]">{team.highestScore}%</span>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Top Score</div>
                                </div>
                                {expanded[i] ? <ChevronUp size={24} className="text-slate-300" /> : <ChevronDown size={24} className="text-slate-300" />}
                            </div>
                        </div>

                        {expanded[i] && (
                            <div className="bg-slate-50/30 border-t border-slate-100 p-8 pt-0 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-8">
                                    {team.members.map((m, j) => (
                                        <div key={j} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:scale-[1.02] transition-transform">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#0B3C5D] text-white flex items-center justify-center text-sm font-black">
                                                    {m.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#0B3C5D]">{m.name}</p>
                                                    {m.isLead ? (
                                                        <span className="text-[9px] font-black text-[#63C132] uppercase tracking-widest">Team Lead</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Specialist</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-black ${m.score >= 75 ? 'text-[#63C132]' : m.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {m.score}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamPerformance;
