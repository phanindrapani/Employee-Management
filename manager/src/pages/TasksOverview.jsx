import React, { useState, useEffect } from 'react';
import API from '../api';
import { CheckSquare, AlertCircle, Clock, CheckCircle2, ListTodo, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TasksOverview = () => {
    const [stats, setStats] = useState([]);
    const [overdue, setOverdue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, overdueRes] = await Promise.all([
                    API.get('/manager/tasks/stats'),
                    API.get('/manager/tasks/overdue')
                ]);
                setStats(statsRes.data);
                setOverdue(overdueRes.data);
            } catch (error) {
                console.error('Failed to fetch tasks', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = {
        'done': '#63C132',
        'in-progress': '#0B3C5D',
        'review': '#F59E0B',
        'todo': '#64748B'
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Tasks Execution Data...</div>;

    const totalTasks = stats.reduce((acc, curr) => acc + curr.count, 0);
    const completionRate = totalTasks ? Math.round((stats.find(s => s._id === 'done')?.count || 0) / totalTasks * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white shadow-2xl shadow-[#0B3C5D]/10 rounded-[24px] text-[#0B3C5D] border border-slate-50">
                        <CheckSquare size={36} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-[#0B3C5D]">Tasks Oversight</h1>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Operational throughput & bottleneck analysis</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-6 py-4 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-4">
                        <div className="p-2 bg-[#63C132]/10 rounded-xl text-[#63C132]">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Execution Efficiency</p>
                            <p className="text-2xl font-black text-[#63C132] leading-none">{completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-[#0B3C5D]">Task Status Distribution</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global metrics across all supervised teams</p>
                        </div>
                        <ListTodo className="text-[#0B3C5D]/20" size={32} />
                    </div>

                    <div className="h-80 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={60}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry._id] || '#64748B'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-8">
                        {['todo', 'in-progress', 'review', 'done'].map((status) => {
                            const stat = stats.find(s => s._id === status);
                            return (
                                <div key={status} className="text-center p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{status}</p>
                                    <p className="text-xl font-black text-[#0B3C5D]">{stat?.count || 0}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Overdue Alerts */}
                <div className="bg-[#0B3C5D] p-8 rounded-[48px] shadow-2xl shadow-[#0B3C5D]/20 text-white flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <AlertTriangle className="text-[#63C132]" size={24} />
                            Critical Alerts
                        </h3>
                        <span className="bg-[#63C132] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-[#63C132]/20">
                            {overdue.length} Delayed
                        </span>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar-white">
                        {overdue.length === 0 ? (
                            <div className="bg-white/5 p-8 rounded-[32px] text-center border border-white/10 mt-12">
                                <CheckCircle2 className="mx-auto text-[#63C132] mb-4" size={40} />
                                <p className="text-sm font-black uppercase tracking-widest">No Overdue Tasks</p>
                                <p className="text-[10px] text-white/40 mt-2">Maximum efficiency maintained</p>
                            </div>
                        ) : (
                            overdue.map((task) => (
                                <div key={task._id} className="bg-white/5 border border-white/10 p-5 rounded-[32px] hover:bg-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">High Risk</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white/30">{new Date(task.deadline).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-black mb-1 group-hover:text-[#63C132] transition-colors">{task.title}</h4>
                                    <p className="text-[10px] text-white/50 font-bold mb-4 uppercase tracking-tighter">Project: {task.project?.name || 'N/A'}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black text-[#63C132]">
                                                {task.assignedTo?.name?.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-bold text-white/70">{task.assignedTo?.name}</span>
                                        </div>
                                        <button className="p-2 hover:bg-[#63C132] hover:text-white rounded-xl transition-all text-[#63C132]">
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 p-6 bg-[#63C132]/10 rounded-[32px] border border-[#63C132]/20">
                        <p className="text-[10px] font-black text-[#63C132] uppercase tracking-[0.2em] mb-2 leading-none">Manager Tip</p>
                        <p className="text-xs text-white/80 font-medium leading-relaxed">Consider reallocating resources if critical alerts persist beyond 48 hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasksOverview;
