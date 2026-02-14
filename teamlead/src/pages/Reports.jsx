import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import {
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    Calendar,
    Target,
    Users
} from 'lucide-react';
import API from '../../api';

const Reports = () => {
    const [loading, setLoading] = useState(true);

    // Mock data for analytics - in a real app, this would come from /api/team/analytics
    const productivityData = [
        { name: 'Mon', tasks: 12, efficiency: 75 },
        { name: 'Tue', tasks: 18, efficiency: 82 },
        { name: 'Wed', tasks: 15, efficiency: 88 },
        { name: 'Thu', tasks: 22, efficiency: 92 },
        { name: 'Fri', tasks: 20, efficiency: 85 },
    ];

    const contributionData = [
        { name: 'John Doe', value: 35 },
        { name: 'Sarah Smith', value: 25 },
        { name: 'Mike Ross', value: 20 },
        { name: 'Rachel Zane', value: 20 },
    ];

    const COLORS = ['#0B3C5D', '#63C132', '#1A4B6D', '#74D144'];

    useEffect(() => {
        setTimeout(() => setLoading(false), 1000);
    }, []);

    if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-[40px]"></div>)}
    </div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Team Intelligence</h1>
                    <p className="text-slate-500 font-medium">Strategic Reports • Performance Metrics & Contribution Analysis</p>
                </div>
            </div>

            {/* Top Row: Productivity & Completion */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Task Volume */}
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-[#63C132]" />
                            Task Completion Volume
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <Calendar size={14} />
                            Last 5 Working Days
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productivityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    cursor={{ fill: '#F8FAFC' }}
                                />
                                <Bar dataKey="tasks" fill="#0B3C5D" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Contribution */}
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <PieIcon className="text-[#63C132]" />
                            Member Contribution
                        </h3>
                        <span className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 rounded-xl uppercase tracking-widest">
                            Task Share %
                        </span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={contributionData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {contributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Efficiency Trend */}
            <div className="bg-[#0B3C5D] p-10 rounded-[40px] shadow-2xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-[#63C132]" />
                        Efficiency Index Trend
                    </h3>
                </div>

                <div className="h-64 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productivityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', background: '#FFF', color: '#0B3C5D', padding: '12px' }}
                            />
                            <Line type="monotone" dataKey="efficiency" stroke="#63C132" strokeWidth={4} dot={{ r: 6, fill: '#63C132', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Insight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#63C132]/10 text-[#63C132] rounded-2xl flex items-center justify-center">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Result Area</div>
                        <div className="text-lg font-black text-[#0B3C5D]">92% Achievement</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Rate</div>
                        <div className="text-lg font-black text-[#0B3C5D]">98.4% Stable</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                        <BarChart size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Velocity</div>
                        <div className="text-lg font-black text-[#0B3C5D]">+12.5% Month</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
