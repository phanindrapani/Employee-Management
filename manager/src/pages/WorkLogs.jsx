import React, { useState, useEffect } from 'react';
import API from '../api';
import { Clock, Download, Search, Calendar, BarChart3, TrendingUp, User, FolderOpen } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const CATEGORY_COLORS = {
    development: '#3B82F6', design: '#8B5CF6', testing: '#F59E0B',
    meeting: '#EF4444', documentation: '#10B981', research: '#06B6D4',
    support: '#F97316', other: '#6B7280'
};

const CustomTooltip = ({ active, payload, label, unit = 'h' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-black text-[#0B3C5D]">
                    {payload[0].value.toFixed(1)}{unit}
                </p>
            </div>
        );
    }
    return null;
};

import useLocalStorage from '../hooks/useLocalStorage';

const WorkLogs = () => {
    const [logs, setLogs] = useLocalStorage('manager_worklogs_list', []);
    const [stats, setStats] = useLocalStorage('manager_worklogs_stats', []);
    const [analysis, setAnalysis] = useLocalStorage('manager_worklogs_analysis', null);
    const [loading, setLoading] = useState(!logs.length || !stats.length || !analysis);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, statsRes, analysisRes] = await Promise.all([
                    API.get('/manager/worklogs'),
                    API.get('/manager/worklogs/stats'),
                    API.get('/manager/worklogs/analysis')
                ]);
                setLogs(logsRes.data);
                setStats(statsRes.data);
                setAnalysis(analysisRes.data);
            } catch (error) {
                console.error('Failed to fetch work logs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.project?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryStyles = (category) => {
        const styles = {
            development: 'bg-blue-100 text-blue-700',
            design: 'bg-purple-100 text-purple-700',
            meeting: 'bg-amber-100 text-amber-700',
            testing: 'bg-emerald-100 text-emerald-700',
            default: 'bg-slate-100 text-slate-700'
        };
        return styles[category] || styles.default;
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-black tracking-widest uppercase text-[10px]">Retrieving Corporate Timesheets...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white shadow-2xl shadow-[#0B3C5D]/10 rounded-[28px] text-[#0B3C5D] border border-slate-50">
                        <Clock size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-[#0B3C5D]">Work Logs</h1>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Resource utilization & temporal audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] shadow-sm border border-slate-50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#63C132] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee, task or project..."
                            className="pl-11 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#63C132]/20 w-80 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-3 bg-slate-50 hover:bg-[#63C132]/10 text-slate-400 hover:text-[#63C132] rounded-2xl transition-all">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.slice(0, 4).map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-50 hover:border-[#63C132]/30 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat._id}</span>
                            <div className="w-2 h-2 rounded-full bg-[#63C132]" />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h4 className="text-2xl font-black text-[#0B3C5D] group-hover:text-[#63C132] transition-colors">
                                {Math.round(stat.totalMinutes / 60)}h
                            </h4>
                            <span className="text-xs font-bold text-slate-400">logged</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Charts */}
            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Productivity Trend */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#63C132]/10 rounded-xl text-[#63C132]">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest">Productivity Trend</h3>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analysis.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                                        }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(val) => `${val}h`}
                                    />
                                    <Tooltip content={<CustomTooltip unit="h" />} />
                                    <Area
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorHours)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest">Category Breakdown</h3>
                        </div>
                        <div className="h-[250px] w-full relative pb-8">
                            {analysis.topCategories?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analysis.topCategories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="hours"
                                            stroke="none"
                                        >
                                            {analysis.topCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.other} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip unit="h" />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => <span className="text-xs font-bold text-slate-500 capitalize">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">
                                    No category data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team-Wise Employee Performance (Interactive) */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-xl text-pink-600">
                                    <User size={20} />
                                </div>
                                <h3 className="text-sm font-black text-[#0B3C5D] uppercase tracking-widest">Team-Wise Employee Performance</h3>
                            </div>
                            {selectedTeam && (
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-[#0B3C5D] uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    Clear Selection
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[300px]">
                            {/* Left Side: Clickable Bar Chart for Teams */}
                            <div className="lg:col-span-2 h-full">
                                {analysis.teamEmployeeDistribution?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysis.teamEmployeeDistribution} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                tickFormatter={(val) => `${val}h`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                content={<CustomTooltip unit="h" />}
                                            />
                                            <Bar
                                                dataKey="totalHours"
                                                fill="#0B3C5D"
                                                radius={[6, 6, 6, 6]}
                                                onClick={(data) => setSelectedTeam(data.name)}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                {analysis.teamEmployeeDistribution.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={selectedTeam === entry.name ? '#63C132' : '#0B3C5D'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                        No team data available
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Employee Breakdown for Selected Team */}
                            <div className="h-full bg-slate-50/50 rounded-[24px] p-6 overflow-y-auto border border-slate-100">
                                {(() => {
                                    if (!analysis.teamEmployeeDistribution || analysis.teamEmployeeDistribution.length === 0) {
                                        return <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold text-center">No employee data</div>;
                                    }

                                    // Default to the highest hour team if nothing is selected
                                    const viewTeamName = selectedTeam || analysis.teamEmployeeDistribution[0]?.name;
                                    const teamData = analysis.teamEmployeeDistribution.find(t => t.name === viewTeamName);

                                    if (!teamData) return null;

                                    // Extract just the employees and their hours
                                    const employees = Object.entries(teamData)
                                        .filter(([k, v]) => k !== 'name' && k !== 'totalHours' && typeof v === 'number' && v > 0)
                                        .sort((a, b) => b[1] - a[1]);

                                    return (
                                        <div>
                                            <h4 className="text-xs font-black text-[#0B3C5D] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                                                <span className="w-2 h-2 rounded-full bg-[#63C132]"></span>
                                                {viewTeamName} Members
                                            </h4>

                                            <div className="space-y-4 pt-2">
                                                {employees.length > 0 ? employees.map(([empName, hours], idx) => (
                                                    <div key={idx} className="flex justify-between items-center group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-[#0B3C5D] border border-slate-100 group-hover:border-[#63C132]/30 transition-colors">
                                                                {empName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-600">{empName}</span>
                                                        </div>
                                                        <span className="text-sm font-black text-[#0B3C5D]">{hours}h</span>
                                                    </div>
                                                )) : (
                                                    <div className="text-xs font-bold text-slate-400 text-center py-4">No employees found</div>
                                                )}
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Total</span>
                                                <span className="text-lg font-black text-[#63C132]">{teamData.totalHours}h</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="bg-white rounded-[48px] shadow-sm border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#0B3C5D] flex items-center justify-center font-black text-white shadow-lg shadow-[#0B3C5D]/10">
                                                {log.employee?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#0B3C5D]">{log.employee?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.employee?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-black text-[#0B3C5D]">
                                                <Calendar size={12} className="text-[#63C132]" />
                                                {log.date}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Clock size={12} />
                                                {log.startTime} - {log.endTime}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-xs">
                                            <p className="text-sm font-black text-[#0B3C5D] leading-tight mb-1">{log.taskTitle}</p>
                                            {log.project && (
                                                <span className="text-[10px] font-bold text-[#63C132] uppercase tracking-[0.2em]">{log.project}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-[#0B3C5D] group-hover:text-[#63C132] transition-all">
                                                {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block shadow-sm ${getCategoryStyles(log.category)}`}>
                                            {log.category}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={40} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found matching criteria</p>
                    </div>
                )}

                <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400">Showing {filteredLogs.length} of {logs.length} logged entries</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-500 hover:text-[#0B3C5D] transition-all">Previous</button>
                        <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black text-[#0B3C5D] hover:bg-slate-50 transition-all">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkLogs;
