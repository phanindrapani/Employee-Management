import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import useSocketListener from '../../hooks/useSocketListener';
import StatCard from '../../components/StatCard';
import {
    CalendarClock,
    History,
    Clock,
    CheckCircle2,
    XCircle,
    FolderKanban,
    ClipboardList
} from 'lucide-react';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cachedData] = useState(() => {
        const cached = localStorage.getItem(`ls_emp_dashboard_agg_${user?._id}`);
        return cached ? JSON.parse(cached) : null;
    });

    const [leaves, setLeaves] = useState(cachedData?.leaves || []);
    const [balance, setBalance] = useState(cachedData?.balance || { cl: 0, sl: 0, el: 0 });
    const [notifications, setNotifications] = useState(cachedData?.notifications || []);
    const [tasks, setTasks] = useState(cachedData?.tasks || []);
    const [projects, setProjects] = useState(cachedData?.projects || []);
    const [loading, setLoading] = useState(!cachedData);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [leavesResult, notifResult, userResult, tasksResult, projectsResult] = await Promise.allSettled([
                API.get('/employee/leaves'),
                API.get('/employee/notifications'),
                API.get('/auth/profile'),
                API.get('/employee/tasks'),
                API.get('/employee/projects')
            ]);

            const freshCache = {
                leaves: leavesResult.status === 'fulfilled' ? leavesResult.value.data : (cachedData?.leaves || []),
                notifications: notifResult.status === 'fulfilled' ? notifResult.value.data : (cachedData?.notifications || []),
                balance: userResult.status === 'fulfilled' ? userResult.value.data?.leaveBalance : (cachedData?.balance || { cl: 0, sl: 0, el: 0 }),
                tasks: tasksResult.status === 'fulfilled' ? tasksResult.value.data : (cachedData?.tasks || []),
                projects: projectsResult.status === 'fulfilled' ? projectsResult.value.data : (cachedData?.projects || [])
            };

            setLeaves(freshCache.leaves);
            setNotifications(freshCache.notifications);
            setBalance(freshCache.balance);
            setTasks(freshCache.tasks);
            setProjects(freshCache.projects);
            localStorage.setItem(`ls_emp_dashboard_agg_${user?._id}`, JSON.stringify(freshCache));

        } catch (err) {
            console.error('Unexpected error in dashboard fetch:', err);
        } finally {
            setLoading(false);
        }
    }, [cachedData]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useSocketListener('leave:created', fetchDashboardData);
    useSocketListener('leave:updated', fetchDashboardData);
    useSocketListener('task:assigned', fetchDashboardData);
    useSocketListener('task:updated', fetchDashboardData);
    useSocketListener('task:deleted', fetchDashboardData);
    useSocketListener('project:created', fetchDashboardData);
    useSocketListener('project:updated', fetchDashboardData);
    useSocketListener('project:deleted', fetchDashboardData);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><XCircle size={12} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
        }
    };

    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const activeProjects = projects.filter(p => p.status === 'ongoing').length;

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#F0F7FF] flex items-center justify-center text-[#0B3C5D] font-black text-xl md:text-2xl border border-[#0B3C5D]/10 overflow-hidden shadow-sm">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                        <p className="text-xs md:text-base text-slate-500 font-medium italic leading-none md:leading-normal">Personal visibility and task execution</p>
                    </div>
                </div>
                <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                    <div className="px-3 py-1 bg-[#F0F7FF] rounded-lg text-[#0B3C5D] font-bold text-[8px] md:text-[10px] uppercase tracking-widest border border-[#0B3C5D]/10 sm:mb-1">
                        Employee Portal
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Leave Balance"
                    value={balance.cl + balance.sl + balance.el}
                    colorClass="border-blue-500"
                    titleColor="text-blue-500"
                    onClick={() => navigate('/leave-history')}
                />
                <StatCard
                    title="My Tasks"
                    value={pendingTasks}
                    colorClass="border-emerald-500"
                    titleColor="text-emerald-500"
                    onClick={() => navigate('/tasks')}
                />
                <StatCard
                    title="My Projects"
                    value={activeProjects}
                    colorClass="border-purple-500"
                    titleColor="text-purple-500"
                    onClick={() => navigate('/projects')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 leading-relaxed">
                {/* Detailed Sections */}
                <div className="lg:col-span-2 space-y-6 md:space-y-10">
                    {/* Tasks Summary */}
                    <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-50 p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                <ClipboardList size={22} className="text-[#63C132]" />
                                Recent Tasks
                            </h3>
                            <button
                                onClick={() => navigate('/tasks')}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0B3C5D] transition-colors"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <p className="text-center py-8 text-slate-400 italic">No tasks assigned</p>
                            ) : (
                                tasks.slice(0, 3).map(task => (
                                    <div
                                        key={task._id}
                                        onClick={() => navigate('/tasks')}
                                        className="flex items-center justify-between p-4 md:p-5 rounded-[20px] bg-slate-50 border border-slate-100 hover:border-[#63C132]/30 transition-all cursor-pointer group/item hover:bg-white hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                            <div className="truncate">
                                                <div className="font-bold text-xs md:text-sm text-[#0B3C5D] group-hover/item:text-[#63C132] transition-colors truncate">{task.title}</div>
                                                <div className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">{task.project?.name || 'Team Project'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <div className="text-[8px] md:text-[10px] font-bold text-slate-500 mb-1 uppercase">DUE</div>
                                            <div className="text-[10px] md:text-xs font-black text-[#0B3C5D]">{new Date(task.deadline).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Leave History (Simplified) */}
                    <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-50 p-6 md:p-8">
                        <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
                            <History size={22} className="text-[#63C132]" />
                            Leave History
                        </h3>
                        <div className="overflow-x-auto -mx-2 px-2">
                            <table className="w-full text-left min-w-[300px]">
                                <thead className="border-b border-slate-100 italic text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                                    <tr>
                                        <th className="pb-4 px-2">Type</th>
                                        <th className="pb-4 px-2">Duration</th>
                                        <th className="pb-4 px-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {leaves.slice(0, 3).map(leave => (
                                        <tr key={leave._id} className="group hover:bg-slate-50/50">
                                            <td className="py-4 px-2 font-bold text-sm text-[#0B3C5D]">{leave.leaveType}</td>
                                            <td className="py-4 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {new Date(leave.fromDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-2 text-right">{getStatusBadge(leave.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6 md:space-y-10">
                    {/* Projects Overview */}
                    <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 border border-blue-50 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-[#0B3C5D]">Active Projects</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ongoing Work</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <FolderKanban size={24} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {projects.filter(p => p.status === 'ongoing').slice(0, 3).map(project => (
                                <div
                                    key={project._id}
                                    onClick={() => navigate('/projects')}
                                    className="space-y-3 cursor-pointer group/proj hover:bg-slate-50 p-2 -m-2 rounded-xl transition-all"
                                >
                                    <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#0B3C5D]">
                                        <span className="line-clamp-1 group-hover/proj:text-[#63C132] transition-colors">{project.name}</span>
                                        <span className="text-[#63C132] font-black">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#63C132] rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {projects.filter(p => p.status === 'ongoing').length === 0 && (
                                <p className="text-sm text-slate-400 text-center italic py-4">No active projects</p>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/projects')}
                            className="w-full mt-6 py-3 bg-[#F0F7FF] text-[#0B3C5D] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#0B3C5D] hover:text-white transition-all shadow-sm"
                        >
                            View All Projects
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
