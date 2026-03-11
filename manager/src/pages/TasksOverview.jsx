import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import {
    CheckSquare,
    Clock,
    CheckCircle2,
    TrendingUp,
    AlertTriangle,
    Users,
    Layers,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSocketListener from '../hooks/useSocketListener';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import useLocalStorage from '../hooks/useLocalStorage';
import StatCard from '../components/StatCard';

const TasksOverview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useLocalStorage(`manager_tasks_overview_stats_${user?._id}`, null);
    const [loading, setLoading] = useState(!stats);
    const [filter, setFilter] = useLocalStorage(`manager_tasks_filter_${user?._id}`, {
        team: '',
        project: '',
        status: '',
        priority: '',
        search: ''
    });

    const fetchDashboardData = useCallback(async () => {
        try {
            const { data } = await API.get('/manager/tasks/dashboard', { params: filter });
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDashboardData();
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [fetchDashboardData]);

    useSocketListener('task:created', fetchDashboardData);
    useSocketListener('task:updated', fetchDashboardData);
    useSocketListener('task:deleted', fetchDashboardData);
    useSocketListener('task:assigned', fetchDashboardData); // NEW
    useSocketListener('project:created', fetchDashboardData); // NEW
    useSocketListener('project:updated', fetchDashboardData); // NEW
    useSocketListener('project:deleted', fetchDashboardData); // NEW
    useSocketListener('milestone:created', fetchDashboardData); // NEW
    useSocketListener('milestone:updated', fetchDashboardData); // NEW
    useSocketListener('milestone:deleted', fetchDashboardData); // NEW

    if (loading && !stats) return (
        <div className="flex items-center justify-center min-h-[400px] text-[#0B3C5D] font-black italic tracking-widest text-xs uppercase animate-pulse">
            Loading data...
        </div>
    );

    const COLORS = ['#0B3C5D', '#63C132', '#F59E0B', '#ef4444', '#64748B', '#8B5CF6'];

    return (
        <div className="space-y-8 pb-12">
            {/* 1️⃣ Summary Cards (Top Section) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Tasks" value={stats?.summary?.total || 0} colorClass="border-blue-500" titleColor="text-blue-500" />
                <StatCard title="Pending" value={stats?.summary?.pending || 0} colorClass="border-slate-400" titleColor="text-slate-400" />
                <StatCard title="In Progress" value={stats?.summary?.inProgress || 0} colorClass="border-indigo-500" titleColor="text-indigo-500" />
                <StatCard title="Completed" value={stats?.summary?.completed || 0} colorClass="border-green-500" titleColor="text-green-500" />
                <StatCard title="Overdue" value={stats?.summary?.overdue || 0} colorClass="border-rose-500" titleColor="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3️⃣ Task Status Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-[#0B3C5D] flex items-center gap-2">
                                <TrendingUp size={20} /> Task Distribution
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">General performance tracking</p>
                        </div>
                        <LayoutDashboard className="text-slate-100" size={40} />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="h-64 w-full md:w-1/2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Pending', count: stats?.summary?.pending },
                                    { name: 'In Progress', count: stats?.summary?.inProgress },
                                    { name: 'Completed', count: stats?.summary?.completed },
                                    { name: 'Overdue', count: stats?.summary?.overdue }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={40}>
                                        {[0, 1, 2, 3].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 8️⃣ Project Task Progress */}
                        <div className="w-full md:w-1/2 space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Project Milestones</h4>
                            {stats?.projectProgress?.map((proj, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-black text-[#0B3C5D] uppercase">
                                        <span>{proj.projectName}</span>
                                        <span>{proj.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#63C132] transition-all duration-1000"
                                            style={{ width: `${proj.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6️⃣ Overdue Tasks Panel */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border-l-4 border-rose-500 border-y border-r border-slate-50 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-[#0B3C5D] flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={20} /> Overdue Tasks
                        </h3>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-widest leading-none">High Priority</span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        {stats?.overdueDetailed?.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle2 className="mx-auto text-green-500 mb-3" size={32} />
                                <p className="text-xs font-black text-[#0B3C5D] uppercase tracking-widest leading-none">Cleared</p>
                            </div>
                        ) : stats?.overdueDetailed?.map((task, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-xs font-black text-[#0B3C5D] line-clamp-1 group-hover:text-[#63C132] transition-colors">{task.title}</h4>
                                    <span className="text-[9px] font-black text-rose-500 uppercase leading-none">! Overdue</span>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{task.assignedTo?.name}</span>
                                    <span className="text-[9px] font-black text-[#0B3C5D] uppercase underline decoration-rose-500/30">{task.project?.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2️⃣ Team Task Breakdown */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2">
                            <Layers size={18} className="text-[#63C132]" /> Team Productivity
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Team</th>
                                    <th className="px-8 py-4 text-center">Total</th>
                                    <th className="px-8 py-4 text-center">Done</th>
                                    <th className="px-8 py-4 text-center">Progress</th>
                                    <th className="px-8 py-4 text-center">Overdue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-[#0B3C5D]">
                                {stats?.teamBreakdown?.map((team, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 font-black">{team.teamName}</td>
                                        <td className="px-8 py-4 text-center">{team.total}</td>
                                        <td className="px-8 py-4 text-center text-green-500">{team.completed}</td>
                                        <td className="px-8 py-4 text-center text-blue-500">{team.inProgress}</td>
                                        <td className="px-8 py-4 text-center text-rose-500">{team.overdue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 7️⃣ Employee Workload Overview */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest flex items-center gap-2">
                            <Users size={18} className="text-indigo-500" /> Employee Workload
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Employee</th>
                                    <th className="px-8 py-4 text-center">Assigned</th>
                                    <th className="px-8 py-4 text-center">Current</th>
                                    <th className="px-8 py-4 text-center">Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-[#0B3C5D]">
                                {stats?.employeeWorkload?.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black">
                                                {emp.name?.charAt(0)}
                                            </div>
                                            <span className="font-black">{emp.name}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center">{emp.totalTasks}</td>
                                        <td className="px-8 py-4 text-center text-indigo-500">{emp.inProgress}</td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${emp.overdue > 0 ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                                                {emp.overdue > 0 ? `${emp.overdue} Delayed` : 'Stable'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4️⃣ Filters & 5️⃣ Main Task Table */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 py-2">
                    <div className="flex items-center gap-2 px-3 text-slate-400">
                        <Filter size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Filters</span>
                    </div>
                    <select
                        className="bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none focus:ring-2 ring-slate-100 shadow-sm"
                        value={filter.team}
                        onChange={(e) => setFilter({ ...filter, team: e.target.value })}
                    >
                        <option value="">TEAM: ALL</option>
                        {stats?.teamBreakdown?.map((t, i) => (
                            <option key={i} value={t.teamId}>{t.teamName}</option>
                        ))}
                    </select>

                    <select
                        className="bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none focus:ring-2 ring-slate-100 shadow-sm"
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="">STATUS: ALL</option>
                        <option value="todo">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Completed</option>
                    </select>

                    <select
                        className="bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none focus:ring-2 ring-slate-100 shadow-sm"
                        value={filter.project}
                        onChange={(e) => setFilter({ ...filter, project: e.target.value })}
                    >
                        <option value="">PROJECT: ALL</option>
                        {stats?.projectProgress?.map((p, i) => (
                            <option key={i} value={p.projectId}>{p.projectName}</option>
                        ))}
                    </select>

                    <select
                        className="bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none focus:ring-2 ring-slate-100 shadow-sm"
                        value={filter.priority}
                        onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                    >
                        <option value="">PRIORITY: ALL</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>

                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH TASKS OR PROJECTS..."
                            className="w-full bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase pl-10 pr-4 py-2 outline-none focus:ring-2 ring-slate-100 shadow-sm tracking-widest"
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden cursor-default">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Task Details</th>
                                    <th className="px-8 py-5">Assigned To</th>
                                    <th className="px-8 py-5">Priority</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-[#0B3C5D]">
                                {stats?.taskList?.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-slate-400 uppercase font-black tracking-widest text-[10px]">
                                            No tasks found matching current filters
                                        </td>
                                    </tr>
                                ) : stats?.taskList?.map((task, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm tracking-tight group-hover:text-[#63C132] transition-colors">{task.title}</span>
                                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{task.project?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                                                    {task.assignedTo?.name?.charAt(0)}
                                                </div>
                                                <span className="font-black uppercase tracking-tighter">{task.assignedTo?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${task.priority === 'urgent' ? 'bg-rose-100 text-rose-600' :
                                                task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                                    task.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {task.priority || 'medium'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none ${task.status === 'done' ? 'bg-green-100 text-green-600' :
                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                                                    task.status === 'review' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {task.status?.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className={`font-black ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-rose-500 underline decoration-rose-500/20' : ''}`}>
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                                {new Date(task.deadline) < new Date() && task.status !== 'done' && (
                                                    <span className="text-[8px] text-slate-300 font-bold uppercase mt-0.5 tracking-widest">Breached</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TasksOverview;
