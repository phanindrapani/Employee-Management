import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle,
    Clock,
    Award
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const PerformanceDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const date = new Date();
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const res = await API.get(`/admin/performance/dashboard?period=${period}`);
            setStats(res.data);
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
            fetchStats();
            alert("Performance scores updated successfully!");
        } catch (error) {
            alert("Calculation failed");
        } finally {
            setCalculating(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Performance Dashboard</h1>
                        <p className="text-slate-500 font-medium">Enterprise Analytics & Scoring</p>
                    </div>
                </div>
                <button
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-colors disabled:opacity-50"
                >
                    {calculating ? (
                        <Clock size={20} className="animate-spin" />
                    ) : (
                        <TrendingUp size={20} />
                    )}
                    {calculating ? 'Calculating...' : 'Update Scores'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.totalEmployees || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Employees Tracked</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Award size={24} />
                        </div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Avg Score</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.avgScore || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Organization Average</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Top</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.summary?.topScore || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Highest Score</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-400">Action</span>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D]">{stats?.needsAttention?.length || 0}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">Need Attention</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Distribution Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-slate-50 flex flex-col">
                    <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <TrendingUp size={20} /> Performance Distribution
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.distribution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="score" fill="#0B3C5D" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="tasks" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers List */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50">
                    <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <Award size={20} className="text-amber-500" /> Top Performers
                    </h3>
                    <div className="space-y-4">
                        {stats?.topPerformers?.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center font-bold text-xs">
                                        {p.user?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#0B3C5D] text-sm">{p.user?.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{p.user?.role}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-[#0B3C5D]">{p.totalScore}</div>
                                </div>
                            </div>
                        ))}
                        {stats?.topPerformers?.length === 0 && (
                            <div className="text-center text-slate-400 text-sm py-4 italic">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Needs Attention Section */}
            {stats?.needsAttention?.length > 0 && (
                <div className="bg-white p-8 rounded-[24px] shadow-sm border-l-4 border-rose-500">
                    <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <AlertCircle size={20} className="text-rose-500" /> Employees Needing Attention
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.needsAttention.map((p, i) => (
                            <div key={i} className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                                    {p.user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0B3C5D]">{p.user?.name}</div>
                                    <div className="text-xs font-bold text-rose-500 uppercase">Score: {p.totalScore}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceDashboard;
