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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: employees } = await API.get('/employees');
                const { data: leaves } = await API.get('/leaves/all');
                const { data: holidays } = await API.get('/holidays');

                const today = new Date().toDateString();

                setStats({
                    totalEmployees: employees.length,
                    pendingLeaves: leaves.filter(l => l.status === 'pending').length,
                    approvedLeaves: leaves.filter(l => l.status === 'approved').length,
                    todaysHolidays: holidays.filter(h => new Date(h.date).toDateString() === today).length
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats');
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={Users}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingLeaves}
                    icon={AlertTriangle}
                    colorClass="bg-amber-100 text-amber-600"
                />
                <StatCard
                    title="Approved Leaves"
                    value={stats.approvedLeaves}
                    icon={CalendarCheck}
                    colorClass="bg-green-100 text-green-600"
                />
                <StatCard
                    title="Today's Holidays"
                    value={stats.todaysHolidays}
                    icon={CalendarDays}
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-primary-600" />
                            Monthly Leave Summary
                        </h3>
                        <span className="text-xs text-slate-400">Current Year</span>
                    </div>

                    <div className="h-64 flex items-end gap-2">
                        {[4, 7, 3, 8, 12, 6, 9, 5, 2, 8, 4, 7].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary-100 rounded-t-lg group-hover:bg-primary-500 transition-all duration-300 relative"
                                    style={{ height: `${val * 15}px` }}
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover:block transition-all">
                                        {val}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="text-primary-600" />
                        Most Leave Types
                    </h3>

                    <div className="space-y-4">
                        {[
                            { label: 'Casual Leave', count: 45, color: 'bg-blue-500' },
                            { label: 'Sick Leave', count: 28, color: 'bg-red-500' },
                            { label: 'Earned Leave', count: 12, color: 'bg-green-500' },
                            { label: 'Loss of Pay', count: 15, color: 'bg-slate-500' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.label}</span>
                                    <span className="font-bold text-slate-900">{item.count}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.count}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
