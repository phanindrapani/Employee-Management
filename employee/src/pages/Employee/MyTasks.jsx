import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    FolderKanban
} from 'lucide-react';
import API from '../../api';

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Fetch tasks assigned to the current employee
                const { data } = await API.get('/tasks/my');
                setTasks(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'todo': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'in-progress': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'review': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'done': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-rose-500';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-emerald-500';
            default: return 'text-slate-500';
        }
    };

    if (loading) return <div className="p-8 animate-pulse space-y-4">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100"></div>)}
        </div>
    </div>;

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">My Tasks</h1>
                    <p className="text-slate-500 font-medium text-sm">Individual action items and deadlines</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#63C132] text-sm font-medium shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Task Filters */}
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
                {['All Tasks', 'Pending', 'Completed'].map((filter, i) => (
                    <button key={i} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-white text-[#0B3C5D] shadow-sm' : 'text-slate-500 hover:text-[#0B3C5D]'}`}>
                        {filter}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex flex-col md:flex-row items-center gap-6">
                        <div className={`w-1.5 h-12 rounded-full ${getStatusStyles(task.status).split(' ')[1].replace('text-', 'bg-')}`}></div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-[#0B3C5D] truncate group-hover:text-[#63C132] transition-colors cursor-pointer">{task.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                    <FolderKanban size={12} className="text-slate-300" /> {task.project?.name || 'Assigned Project'}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                    • {task.priority} Priority
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Due Date</span>
                                <div className="flex items-center gap-2 text-[#0B3C5D] font-black text-sm">
                                    <Calendar size={14} className="text-slate-300" />
                                    {new Date(task.deadline).toLocaleDateString()}
                                </div>
                            </div>

                            <div className={`px-5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${getStatusStyles(task.status)}`}>
                                {task.status}
                            </div>

                            <button className="p-3 bg-slate-50 text-[#0B3C5D] rounded-xl hover:bg-[#63C132] hover:text-white transition-all transform hover:scale-110">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && !loading && (
                    <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ClipboardList size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">All Caught Up!</h3>
                        <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">You have no pending tasks. Check back later or enjoy your free time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTasks;
