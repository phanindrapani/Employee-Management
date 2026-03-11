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
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import useSocketListener from '../hooks/useSocketListener';

const ScorePill = ({ score }) => {
    const color = score >= 75 ? '#63C132' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
    );
};

import useLocalStorage from '../hooks/useLocalStorage';

const TeamPerformance = () => {
    const { user } = useAuth();
    const [stats, setStats] = useLocalStorage(`manager_performance_stats_${user?._id}`, null);
    const [loading, setLoading] = useState(!stats);
    const [expanded, setExpanded] = useState({});

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

    useEffect(() => {
        fetchStats();
    }, []);

    useSocketListener('task:updated', fetchStats);
    useSocketListener('milestone:updated', fetchStats);

    const toggleTeam = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#0B3C5D] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
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
                <StatCard title="Managed Teams" value={stats?.summary?.totalTeams || 0} colorClass="border-blue-500" titleColor="text-blue-600" />
                <StatCard title="Teams Average Score" value={`${stats?.summary?.orgAvgScore || 0}%`} colorClass="border-emerald-500" titleColor="text-emerald-600" />
                <StatCard title="Highest Team Average" value={`${stats?.summary?.highestTeamAvg || 0}%`} colorClass="border-amber-500" titleColor="text-amber-600" />
                <StatCard title="Teams Needing Focus" value={stats?.summary?.teamsNeedingAttention || 0} colorClass="border-rose-500" titleColor="text-rose-600" />
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
                    <div key={i} className="bg-white rounded-[20px] shadow-sm border border-slate-50 overflow-hidden">
                        <div
                            className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleTeam(i)}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] text-white flex items-center justify-center font-black text-lg shrink-0">
                                {team.teamName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-[#0B3C5D] text-lg">{team.teamName}</div>
                                <div className="text-xs text-slate-400 font-bold">Lead: {team.leadName} · {team.membersCount} Specialists</div>
                            </div>
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="text-center">
                                    <ScorePill score={team.avgScore} />
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Team Avg</div>
                                </div>
                                <div className="text-center hidden sm:block">
                                    <span className="text-2xl font-black text-[#0B3C5D]">{team.highestScore}%</span>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Best Score</div>
                                </div>
                                {expanded[i] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                            </div>
                        </div>

                        {expanded[i] && (
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
        </div>
    );
};

export default TeamPerformance;
