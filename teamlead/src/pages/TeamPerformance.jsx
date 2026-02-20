import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Users,
    TrendingUp,
    Award,
    AlertCircle,
    Clock,
    CheckCircle2,
    CalendarCheck,
    RefreshCw
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

const getScoreColor = (score) => {
    if (score >= 75) return '#63C132';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
};

const TeamPerformance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const res = await API.get('/team-lead/team/performance');
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch team performance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setCalculating(true);
        try {
            const date = new Date();
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            await API.post('/admin/performance/calculate', { period });
            await fetchPerformance();
        } catch (error) {
            console.error('Recalculate error:', error);
        } finally {
            setCalculating(false);
        }
    };

    if (loading) return (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-10">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-[32px] shadow-sm" />)}
        </div>
    );

    const members = data?.members || [];
    const avgScore = data?.avgScore || 0;
    const needsAttention = members.filter(m => m.totalScore < 50);
    const topPerformer = members.length > 0 ? [...members].sort((a, b) => b.totalScore - a.totalScore)[0] : null;

    return (
        <div className="space-y-8 text-[#0B3C5D] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Team Performance</h1>
                        <p className="text-slate-500 font-medium">Individual scores for your team members · {data?.period}</p>
                    </div>
                </div>
                <button
                    onClick={handleRecalculate}
                    disabled={calculating}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-colors disabled:opacity-50"
                >
                    {calculating ? <Clock size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                    {calculating ? 'Refreshing...' : 'Refresh Scores'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Total</span>
                    </div>
                    <div className="text-3xl font-black">{members.length}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Team Members</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Team Avg</span>
                    </div>
                    <div className="text-3xl font-black" style={{ color: getScoreColor(avgScore) }}>{avgScore}%</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Average Score</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={24} /></div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Action</span>
                    </div>
                    <div className="text-3xl font-black text-rose-500">{needsAttention.length}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Need Attention (&lt;50%)</div>
                </div>
            </div>

            {/* Bar Chart */}
            {members.length > 0 && (
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <TrendingUp size={20} /> Member Scores
                    </h3>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={members} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`${value}%`, 'Score']}
                                />
                                <Bar dataKey="totalScore" radius={[6, 6, 0, 0]} barSize={32}>
                                    {members.map((m, i) => (
                                        <Cell key={i} fill={getScoreColor(m.totalScore)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Member Cards */}
            <div>
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <Users size={20} /> Member Breakdown
                </h3>
                {members.length === 0 ? (
                    <div className="text-center text-slate-400 py-16 font-medium italic bg-white rounded-[24px]">
                        No team members found. Make sure your team is assigned in the system.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member, i) => (
                            <div key={i} className="bg-white rounded-[24px] shadow-sm border border-slate-50 p-6 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-5">
                                    {member.profilePicture ? (
                                        <img src={member.profilePicture} alt={member.name} className="w-12 h-12 rounded-2xl object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] text-white flex items-center justify-center font-black text-xl">
                                            {member.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="overflow-hidden">
                                        <div className="font-black text-[#0B3C5D] truncate">{member.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</div>
                                    </div>
                                </div>

                                {/* Score Badge */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[16px] mb-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Score</div>
                                    <div className="text-2xl font-black" style={{ color: getScoreColor(member.totalScore) }}>
                                        {member.totalScore}%
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <CheckCircle2 size={14} className="text-[#63C132]" /> Task Completion
                                        </div>
                                        <span className="text-xs font-black text-[#0B3C5D]">{member.taskCompletionScore}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <CalendarCheck size={14} className="text-blue-500" /> Attendance
                                        </div>
                                        <span className="text-xs font-black text-[#0B3C5D]">{member.attendanceScore}%</span>
                                    </div>
                                </div>

                                {member.totalScore < 50 && (
                                    <div className="mt-4 flex items-center gap-2 text-xs font-black text-rose-500 bg-rose-50 px-3 py-2 rounded-xl">
                                        <AlertCircle size={14} /> Needs attention
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamPerformance;
