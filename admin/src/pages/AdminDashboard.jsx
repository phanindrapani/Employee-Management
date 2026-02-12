import React, { useState, useEffect } from 'react';
import API from '../api';
import StatCard from '../components/StatCard';
import {
    Users,
    CalendarCheck,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    CalendarDays
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        todaysHolidays: 0
    });
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [leaveDistribution, setLeaveDistribution] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/admin/stats');
                setStats(data.stats);
                setMonthlyTrend(data.monthlyTrend);
                setLeaveDistribution(data.distribution);
            } catch (err) {
                console.error('Failed to fetch dashboard stats');
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
                    <p className="text-slate-500 font-medium italic">Summary of all activity</p>
                </div>
                <div className="px-4 py-2 bg-[#F0F7FF] rounded-xl text-[#0B3C5D] font-bold text-xs uppercase tracking-widest border border-[#0B3C5D]/10">
                    System: Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={Users}
                    colorClass="bg-[#F0F7FF] text-[#0B3C5D]"
                />
                <StatCard
                    title="Pending Leaves"
                    value={stats.pendingLeaves}
                    icon={AlertTriangle}
                    colorClass="bg-[#FFFBEB] text-[#D97706]"
                />
                <StatCard
                    title="Approved Leaves"
                    value={stats.approvedLeaves}
                    icon={CalendarCheck}
                    colorClass="bg-[#F0FFF4] text-[#63C132]"
                />
                <StatCard
                    title="Today's Holidays"
                    value={stats.todaysHolidays}
                    icon={CalendarDays}
                    colorClass="bg-[#F5F3FF] text-[#7C3AED]"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card shadow-sm border-none bg-white p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 size={20} className="text-[#63C132]" />
                            Monthly Leave Trend
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Current Year</span>
                    </div>

                    <div className="h-64 flex items-end gap-3 px-2">
                        {monthlyTrend.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-[#E0E7FF] rounded-t-lg group-hover:bg-[#0B3C5D] transition-all duration-300 relative"
                                    style={{ height: `${val > 0 ? (val * 20) : 4}px`, minHeight: '4px', maxHeight: '100%' }}
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B3C5D] text-white text-[10px] px-2 py-1 rounded hidden group-hover:block transition-all shadow-lg font-bold">
                                        {val}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card shadow-sm border-none bg-white p-6">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#63C132]" />
                        Leave Type Distribution
                    </h3>

                    <div className="space-y-6">
                        {leaveDistribution.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm italic">No leave data available</p>
                        ) : (
                            leaveDistribution.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-600 uppercase">{item.label}</span>
                                        <span className="font-bold text-[#0B3C5D]">{item.count}% ({item.value})</span>
                                    </div>
                                    <div className="h-3 bg-[#F4F6F9] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#0B3C5D] rounded-full transition-all duration-1000"
                                            style={{ width: `${item.count}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
