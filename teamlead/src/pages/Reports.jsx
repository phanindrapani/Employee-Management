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
import API from '../api';
import StatCard from '../components/StatCard';

const Reports = () => {
    const [reportData, setReportData] = useState(() => {
        const cached = localStorage.getItem('ls_tl_reports_data');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!reportData);

    const COLORS = ['#0B3C5D', '#63C132', '#1A4B6D', '#74D144'];

    const fetchReports = async () => {
        try {
            const { data } = await API.get('/team-lead/reports');
            setReportData(data);
            localStorage.setItem('ls_tl_reports_data', JSON.stringify(data));
            setLoading(false);
        } catch (error) {
            console.error("Fetch reports error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse p-4 md:p-10">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-[40px]"></div>)}
    </div>;

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Team Intelligence</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium italic">Strategic Reports • Insights & Trends</p>
                </div>
            </div>

            {/* Top Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <StatCard
                    title="Achievement Rate"
                    value={`${reportData?.summary?.achievementRate || 0}%`}
                    colorClass="border-green-500"
                    titleColor="text-green-600"
                />
                <StatCard
                    title="Active Professionals"
                    value={reportData?.summary?.teamSize || 0}
                    colorClass="border-blue-500"
                    titleColor="text-blue-500"
                />
                <StatCard
                    title="Milestones Completed"
                    value={reportData?.summary?.totalCompleted || 0}
                    colorClass="border-amber-500"
                    titleColor="text-amber-500"
                />
            </div>

            {/* Top Row: Productivity & Completion */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Weekly Task Volume */}
                <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                        <h3 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-[#63C132]" />
                            Task Volume Trend
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Calendar size={14} />
                            Last 5 Working Days
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData?.productivityTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    cursor={{ fill: '#F8FAFC' }}
                                />
                                <Bar dataKey="tasks" fill="#0B3C5D" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Contribution */}
                <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <PieIcon className="text-[#63C132]" />
                            Member Contribution
                        </h3>
                        <span className="px-3 py-1 bg-slate-50 text-[10px] font-black text-slate-400 rounded-lg uppercase tracking-widest">
                            Share %
                        </span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData?.contributionData || []}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(reportData?.contributionData || []).map((entry, index) => (
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
            <div className="bg-[#0B3C5D] p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-3 !text-white">
                        <TrendingUp className="text-[#63C132]" />
                        Efficiency Index Trend
                    </h3>
                </div>

                <div className="h-64 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData?.productivityTrend || []}>
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

        </div>
    );
};

export default Reports;
