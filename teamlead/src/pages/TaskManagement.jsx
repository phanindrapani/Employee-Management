import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    User,
    ChevronDown
} from 'lucide-react';
import API from '../../api';

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, todo, in-progress, done, overdue
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const { data } = await API.get('/tasks/team');
                setTasks(data);
                setLoading(false);
            } catch (error) {
                console.error("Fetch tasks error:", error);
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'overdue') {
            return new Date(task.deadline) < new Date() && task.status !== 'done';
        }
        return task.status === filter;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'todo': return 'bg-slate-100 text-slate-500';
            case 'in-progress': return 'bg-blue-50 text-blue-600';
            case 'review': return 'bg-amber-50 text-amber-600';
            case 'done': return 'bg-[#63C132]/10 text-[#63C132]';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    if (loading) return <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-white rounded-3xl"></div>
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white rounded-2xl"></div>)}
    </div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">Task Operations</h1>
                    <p className="text-slate-500 font-medium">Daily Control • Team Assignment & Execution Tracking</p>
                </div>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.05] shadow-xl shadow-[#0B3C5D]/20"
                >
                    <Plus size={18} />
                    Assign New Task
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'todo', 'in-progress', 'done', 'overdue'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-[#0B3C5D] text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            {f.replace('-', ' ')}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="pl-12 pr-6 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#0B3C5D]/10 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Task Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div>
                                        <div className="font-bold text-[#0B3C5D] group-hover:text-[#63C132] transition-colors">{task.title}</div>
                                        <div className="text-xs text-slate-400 font-medium">{task.project?.name}</div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-[#0B3C5D]">
                                            {task.assignedTo?.name?.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">{task.assignedTo?.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className={`flex items-center gap-2 text-sm font-bold ${new Date(task.deadline) < new Date() && task.status !== 'done'
                                            ? 'text-rose-500'
                                            : 'text-slate-500'
                                        }`}>
                                        <Calendar size={14} />
                                        {new Date(task.deadline).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(task.status)}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-slate-300 hover:text-[#0B3C5D] hover:bg-white rounded-xl transition-all">
                                        <ChevronDown size={20} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                            <ClipboardList size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No tasks found in this category</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Stats for filtered view */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#63C132]/5 p-6 rounded-[32px] border border-[#63C132]/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#63C132] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#63C132]/20">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</div>
                        <div className="text-2xl font-black text-[#0B3C5D]">{tasks.filter(t => t.status === 'done').length}</div>
                    </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</div>
                        <div className="text-2xl font-black text-[#0B3C5D]">{tasks.filter(t => t.status === 'in-progress').length}</div>
                    </div>
                </div>
                <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immediate Attention</div>
                        <div className="text-2xl font-black text-[#0B3C5D]">
                            {tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskManagement;
