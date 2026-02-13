import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
    Users,
    Building2,
    Briefcase,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Plus,
    TrendingUp,
    Activity,
    CalendarDays,
    Layers,
    UserPlus,
    FolderPlus,
    CalendarPlus
} from 'lucide-react';
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
    Legend
} from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await API.get('/admin/stats');
                setData(response.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-screen text-[#0B3C5D] font-bold">Loading Dashboard...</div>;
    if (!data) return <div className="text-center text-red-500 font-bold mt-10">Failed to load data</div>;

    const { summary, pendingActions, teamPerformance, recentActivity, monthlyTrend, distribution } = data;

    // Chart Data Preparation
    const projectStatusData = [
        { name: 'Upcoming', value: summary.projects.upcoming, color: '#6366F1' },
        { name: 'Ongoing', value: summary.projects.ongoing, color: '#3B82F6' },
        { name: 'Completed', value: summary.projects.completed, color: '#10B981' },
        { name: 'On Hold', value: summary.projects.onHold, color: '#F59E0B' },
    ].filter(item => item.value > 0);

    const leaveDistributionData = distribution.map((item, index) => ({
        name: item.label,
        value: item.value,
        color: ['#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E'][index % 4]
    }));

    const monthlyTrendData = monthlyTrend.map((val, index) => ({
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
        leaves: val
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">

            {/* 1. TOP SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Organization Stats */}
                <div className="card p-5 border-l-4 border-[#0B3C5D] flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Employees</h4>
                        <div className="text-3xl font-black text-[#0B3C5D] mt-1">{summary.employees}</div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1"><Users size={14} /> {summary.teams} Teams</div>
                        <div className="flex items-center gap-1"><Building2 size={14} /> {summary.departments} Depts</div>
                    </div>
                </div>

                {/* Project Stats */}
                <div className="card p-5 border-l-4 border-[#3B82F6] flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Projects</h4>
                        <div className="text-3xl font-black text-[#3B82F6] mt-1">{summary.projects.ongoing}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 text-xs font-medium text-slate-500">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{summary.projects.completed} Done</span>
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{summary.projects.total} Total</span>
                    </div>
                </div>

                {/* Leave Stats */}
                <div className="card p-5 border-l-4 border-[#F59E0B] flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Leaves</h4>
                        <div className="text-3xl font-black text-[#F59E0B] mt-1">{summary.leaves.pending}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 text-xs font-medium text-slate-500">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{summary.leaves.approvedThisMonth} Approved</span>
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{summary.leaves.rejectedThisMonth} Rejected</span>
                    </div>
                </div>

                {/* Holiday Stats */}
                <div className="card p-5 border-l-4 border-[#EC4899] flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Next Holiday</h4>
                        <div className="font-bold text-[#EC4899] mt-1 truncate" title={summary.holidays.upcoming?.name || 'None'}>
                            {summary.holidays.upcoming?.name || 'None'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                            {summary.holidays.upcoming ? new Date(summary.holidays.upcoming.date).toLocaleDateString() : '-'}
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 flex items-center gap-1">
                        <CalendarDays size={14} /> {summary.holidays.total} Total this year
                    </div>
                </div>
            </div>

            {/* 2. PENDING ACTIONS & ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Actions (Left Column) */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Pending Leaves List */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0B3C5D] flex items-center gap-2">
                                <Clock size={18} className="text-[#F59E0B]" /> Pending Actions
                            </h3>
                            <button onClick={() => navigate('/leaves')} className="text-xs text-blue-600 font-bold hover:underline">View All</button>
                        </div>
                        <div className="space-y-3">
                            {pendingActions.leaves.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No pending leaves.</p>
                            ) : (
                                pendingActions.leaves.map(leave => (
                                    <div key={leave._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center font-bold text-xs">
                                            {leave.user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#0B3C5D] truncate">{leave.user.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{new Date(leave.appliedAt).toLocaleDateString()} • {leave.leaveType}</p>
                                        </div>
                                        <button onClick={() => navigate('/leaves')} className="text-[#3B82F6] hover:bg-blue-50 p-1.5 rounded-full transition-colors">
                                            <CheckCircle2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0B3C5D] flex items-center gap-2">
                                <AlertTriangle size={18} className="text-[#EF4444]" /> Upcoming Deadlines
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {pendingActions.deadlines.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No project deadlines this week.</p>
                            ) : (
                                pendingActions.deadlines.map(project => (
                                    <div key={project._id} className="p-3 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-[#0B3C5D]">{project.name}</p>
                                            <p className="text-xs text-red-600 font-medium">Due: {new Date(project.endDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded text-slate-500 border border-slate-100">
                                            {project.assignedTeam?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Analytics (Right 2 Columns) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Status Chart */}
                    <div className="card h-80 flex flex-col">
                        <h3 className="font-bold text-[#0B3C5D] mb-4 flex items-center gap-2">
                            <PieChart size={18} /> Project Status
                        </h3>
                        <div className="flex-1 min-h-0">
                            {projectStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={projectStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {projectStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 italic">No projects data</div>
                            )}
                        </div>
                    </div>

                    {/* Leave Trend Chart */}
                    <div className="card h-80 flex flex-col">
                        <h3 className="font-bold text-[#0B3C5D] mb-4 flex items-center gap-2">
                            <TrendingUp size={18} /> Leave Trend (2026)
                        </h3>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="leaves" fill="#0B3C5D" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. TEAM PERFORMANCE SNAPSHOT */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#0B3C5D] flex items-center gap-2">
                        <Layers size={18} /> Team Performance Snapshot
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="pb-3 pl-2">Team Name</th>
                                <th className="pb-3">Team Lead</th>
                                <th className="pb-3 text-center">Members</th>
                                <th className="pb-3 text-center">Active Projects</th>
                                <th className="pb-3 w-1/3">Avg. Progress</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {teamPerformance.map(team => (
                                <tr key={team._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 pl-2 font-bold text-[#0B3C5D]">{team.name}</td>
                                    <td className="py-4 text-slate-600">{team.lead}</td>
                                    <td className="py-4 text-center font-bold">{team.members}</td>
                                    <td className="py-4 text-center font-bold text-[#0B3C5D]">{team.activeProjects}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${team.avgProgress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 w-8">{team.avgProgress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. ACTIVITY FEED & QUICK ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 card">
                    <h3 className="font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <Activity size={18} /> Recent Activity
                    </h3>
                    <div className="space-y-6">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-white ${activity.type === 'leave' ? 'bg-amber-500' :
                                        activity.type === 'project' ? 'bg-blue-500' : 'bg-emerald-500'
                                        }`}></div>
                                    {index !== recentActivity.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                                </div>
                                <div className="pb-2">
                                    <p className="text-sm font-medium text-[#0B3C5D]">{activity.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(activity.time).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1 card">
                    <h3 className="font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[#63C132]" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/employees')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col items-center gap-2 transition-all group">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <UserPlus size={20} />
                            </div>
                            <span className="text-xs font-bold text-[#0B3C5D]">Add Employee</span>
                        </button>
                        <button onClick={() => navigate('/projects/create')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col items-center gap-2 transition-all group">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <FolderPlus size={20} />
                            </div>
                            <span className="text-xs font-bold text-[#0B3C5D]">New Project</span>
                        </button>
                        <button onClick={() => navigate('/teams')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col items-center gap-2 transition-all group">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Users size={20} />
                            </div>
                            <span className="text-xs font-bold text-[#0B3C5D]">Create Team</span>
                        </button>
                        <button onClick={() => navigate('/holidays')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col items-center gap-2 transition-all group">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-full group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                <CalendarPlus size={20} />
                            </div>
                            <span className="text-xs font-bold text-[#0B3C5D]">Add Holiday</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
