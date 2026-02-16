import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
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
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState({ cl: 0, sl: 0, el: 0 });
    const [notifications, setNotifications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [leavesResult, notifResult, userResult, tasksResult, projectsResult] = await Promise.allSettled([
                API.get('/leaves'),
                API.get('/notifications'),
                API.get('/auth/profile'),
                API.get('/tasks/my'),
                API.get('/team/projects')
            ]);

            if (leavesResult.status === 'fulfilled') setLeaves(leavesResult.value.data);
            if (notifResult.status === 'fulfilled') setNotifications(notifResult.value.data);
            if (userResult.status === 'fulfilled') {
                const userData = userResult.value.data;
                if (userData && userData.leaveBalance) setBalance(userData.leaveBalance);
            }
            if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value.data);
            if (projectsResult.status === 'fulfilled') setProjects(projectsResult.value.data);

        } catch (err) {
            console.error('Unexpected error in dashboard fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#F0F7FF] flex items-center justify-center text-[#0B3C5D] font-black text-2xl border border-[#0B3C5D]/10 overflow-hidden shadow-sm">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                        <p className="text-slate-500 font-medium italic">Personal visibility and task execution</p>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <div className="px-4 py-2 bg-[#F0F7FF] rounded-xl text-[#0B3C5D] font-bold text-[10px] uppercase tracking-widest border border-[#0B3C5D]/10 mb-1">
                        Employee Portal
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/leave-history')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                            <CalendarClock size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">Available</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{balance.cl + balance.sl + balance.el}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Balance</p>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/tasks')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <ClipboardList size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 text-right">Incomplete</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{pendingTasks}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Tasks</p>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/projects')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                            <FolderKanban size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">Active</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-[#0B3C5D]">{activeProjects}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Projects</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 leading-relaxed">
                {/* Detailed Sections */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Tasks Summary */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
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
                                    <div key={task._id} className="flex items-center justify-between p-5 rounded-[20px] bg-slate-50 border border-slate-100 hover:border-[#63C132]/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <div className="font-bold text-sm text-[#0B3C5D]">{task.title}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{task.project?.name || 'Team Project'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-500 mb-1">DUE DATE</div>
                                            <div className="text-xs font-black text-[#0B3C5D]">{new Date(task.deadline).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Leave History (Simplified) */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <History size={22} className="text-[#63C132]" />
                            Leave History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
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
                                                {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
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
                <div className="space-y-10">
                    {/* Projects Overview */}
                    <div className="bg-white rounded-[32px] p-8 border border-blue-50 shadow-sm hover:shadow-md transition-all">
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
                                <div key={project._id} className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#0B3C5D]">
                                        <span className="line-clamp-1">{project.name}</span>
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
                            className="w-full mt-6 py-3 bg-[#F0F7FF] text-[#0B3C5D] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#0B3C5D] hover:text-white transition-all"
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
