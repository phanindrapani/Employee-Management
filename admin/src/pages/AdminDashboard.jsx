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
    CalendarPlus,
    ChevronDown,
    ChevronUp,
    FileText
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
import useSocketListener from '../hooks/useSocketListener';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(() => {
        const cached = localStorage.getItem('ls_admin_stats');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!data);
    const [showAllActivities, setShowAllActivities] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await API.get('/admin/stats');
            setData(response.data);
            localStorage.setItem('ls_admin_stats', JSON.stringify(response.data));
        } catch (err) {
            console.error('Failed to fetch dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useSocketListener('employee:created', fetchStats);
    useSocketListener('employee:deleted', fetchStats);
    useSocketListener('team:created', fetchStats);
    useSocketListener('team:deleted', fetchStats);
    useSocketListener('department:created', fetchStats);
    useSocketListener('department:deleted', fetchStats);
    useSocketListener('project:created', fetchStats);
    useSocketListener('project:updated', fetchStats); // Status changes
    useSocketListener('project:deleted', fetchStats);
    useSocketListener('leave:created', fetchStats); // Pending count
    useSocketListener('leave:updated', fetchStats); // Approved/Rejected count
    useSocketListener('holiday:created', fetchStats);
    useSocketListener('holiday:deleted', fetchStats);
    useSocketListener('document:uploaded', fetchStats);
    useSocketListener('document:verified', fetchStats);
    useSocketListener('document:rejected', fetchStats);
    useSocketListener('document:deleted', fetchStats);

    const summary = data?.summary || { employees: 0, teams: 0, departments: 0, projects: { ongoing: 0, upcoming: 0, completed: 0, onHold: 0 } };
    const pendingActions = data?.pendingActions || [];
    const teamPerformance = data?.teamPerformance || [];
    const recentActivity = data?.recentActivity || [];
    const monthlyTrend = data?.monthlyTrend || [];
    const distribution = data?.distribution || [];

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
        <div className="space-y-8 text-[#0B3C5D]">

            {/* Content Area */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[500px] text-slate-400 font-bold italic">
                    Initializing Enterprise Dashboard...
                </div>
            ) : !data ? (
                <div className="text-center py-20 text-red-400 font-bold uppercase tracking-widest">
                    Data Load Failure
                </div>
            ) : (
                <>
                    {/* 1. TOP SUMMARY CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Organization Stats */}
                        <div
                            onClick={() => navigate('/employees')}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-[#0B3C5D] flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <div>
                                <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Employees</h4>
                                <div className="text-3xl font-black text-[#0B3C5D] mt-1">{summary.employees}</div>
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{summary.teams} Teams</span>
                                <span>{summary.departments} Depts</span>
                            </div>
                        </div>

                        {/* Project Stats */}
                        <div
                            onClick={() => navigate('/projects')}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-[#3B82F6] flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <div>
                                <h4 className="text-sky-500 text-[10px] font-bold uppercase tracking-widest">Active Projects</h4>
                                <div className="text-3xl font-black text-[#3B82F6] mt-1">{summary.projects.ongoing}</div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-emerald-500">{summary.projects.completed} Done</span>
                                <span className="text-slate-400">{summary.projects.total} Total</span>
                            </div>
                        </div>

                        {/* Leave Stats */}
                        <div
                            onClick={() => navigate('/leaves')}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-[#F59E0B] flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <div>
                                <h4 className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">Pending Leaves</h4>
                                <div className="text-3xl font-black text-[#F59E0B] mt-1">{summary.leaves.pending}</div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-emerald-500">{summary.leaves.approvedThisMonth} Approved</span>
                                <span className="text-rose-500">{summary.leaves.rejectedThisMonth} Rejected</span>
                            </div>
                        </div>

                        {/* Holiday Stats */}
                        <div
                            onClick={() => navigate('/holidays')}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-[#EC4899] flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <div>
                                <h4 className="text-pink-500 text-[10px] font-bold uppercase tracking-widest">Next Holiday</h4>
                                <div className="text-xl font-black text-[#EC4899] mt-1 truncate" title={summary.holidays.upcoming?.name || 'None'}>
                                    {summary.holidays.upcoming?.name || 'None'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                    {summary.holidays.upcoming ? new Date(summary.holidays.upcoming.date).toLocaleDateString() : 'No upcoming'}
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {summary.holidays.total} Total this year
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
                                                    {leave.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0" title={`Reason: ${leave.reason || 'N/A'}`}>
                                                    <p className="text-sm font-bold text-[#0B3C5D] truncate">{leave.user?.name || 'Unknown User'}</p>
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

                            {/* Pending Documents */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-[#0B3C5D] flex items-center gap-2">
                                        <FileText size={18} className="text-[#6366F1]" /> Document Requests
                                    </h3>
                                    <button onClick={() => navigate('/employees')} className="text-xs text-blue-600 font-bold hover:underline">View All</button>
                                </div>
                                <div className="space-y-3">
                                    {!pendingActions.documents || pendingActions.documents.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No pending documents.</p>
                                    ) : (
                                        pendingActions.documents.map(doc => (
                                            <div key={doc._id} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors"
                                                onClick={() => navigate(`/employees/${doc.user?._id || doc.user}`)}>
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                                                    {doc.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[#0B3C5D] truncate">{doc.user?.name || 'Unknown User'}</p>
                                                    <p className="text-xs text-slate-500 truncate">{doc.documentName}</p>
                                                </div>
                                                <div className="text-indigo-600">
                                                    <Activity size={14} />
                                                </div>
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
                                                    {project.managerId?.name || 'No Manager'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Analytics */}
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
                                    <TrendingUp size={18} /> Leave Trend ({new Date().getFullYear()})
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



                    {/* 4. ACTIVITY FEED & QUICK ACTIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 card">
                            <h3 className="font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                                <Activity size={18} /> Recent Activity
                            </h3>
                            <div className="space-y-6">
                                {recentActivity.slice(0, showAllActivities ? undefined : 6).map((activity, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-white ${activity.type === 'leave' ? 'bg-amber-500' :
                                                    activity.type === 'project' ? 'bg-blue-500' :
                                                        activity.type === 'ticket' ? 'bg-rose-500' :
                                                            activity.type === 'document' ? 'bg-indigo-500' :
                                                                'bg-emerald-500'
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

                            {recentActivity.length > 6 && (
                                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
                                    <button
                                        onClick={() => setShowAllActivities(!showAllActivities)}
                                        className="flex items-center gap-2 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                                    >
                                        {showAllActivities ? (
                                            <>Show Less <ChevronUp size={14} /></>
                                        ) : (
                                            <>View All Activities <ChevronDown size={14} /></>
                                        )}
                                    </button>
                                </div>
                            )}
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
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
