import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    User,
    ClipboardList,
    ChevronDown,
    X,
    Target,
    Scale,
    Briefcase,
    ChevronRight,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import API from '../api';
import useSocketListener from '../hooks/useSocketListener';

const AssignTaskModal = ({ onClose, onSuccess, projects, members, taskToEdit }) => {
    const [formData, setFormData] = useState({
        title: taskToEdit?.title || '',
        description: taskToEdit?.description || '',
        project: taskToEdit?.project?._id || taskToEdit?.project || '',
        assignedTo: taskToEdit?.assignedTo?._id || taskToEdit?.assignedTo || '',
        deadline: taskToEdit?.deadline ? new Date(taskToEdit.deadline).toISOString().split('T')[0] : '',
        priority: taskToEdit?.priority || 'medium',
        weight: taskToEdit?.weight || 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Automate weight according to priority
    useEffect(() => {
        const weightMap = {
            low: 1,
            medium: 3,
            high: 5,
            urgent: 10
        };
        setFormData(prev => ({ ...prev, weight: weightMap[prev.priority] || 1 }));
    }, [formData.priority]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            if (taskToEdit) {
                await API.put(`/team-lead/tasks/${taskToEdit._id}`, formData);
            } else {
                await API.post('/team-lead/tasks', formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save task");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-[#0B3C5D]">
                            {taskToEdit ? <ClipboardList size={24} /> : <Plus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight">
                                {taskToEdit ? 'Edit Tactical Task' : 'Assign New Task'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Deployment Operations</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-300 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter task objective..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Context</label>
                            <select
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10"
                                value={formData.project}
                                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Member</label>
                            <select
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10"
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            >
                                <option value="">Select Assignee</option>
                                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Execution Deadline</label>
                            <input
                                required
                                type="date"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Matrix</label>
                            <select
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                                <option value="urgent">Critical/Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 bg-[#63C132]/5 rounded-[32px] border border-[#63C132]/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest">
                                <Scale size={14} className="text-[#63C132]" /> Task weight (Impact)
                            </div>
                            <div className="flex bg-white px-3 py-1 rounded-xl border border-slate-100">
                                <input
                                    type="number"
                                    readOnly
                                    disabled
                                    className="w-10 text-center font-black text-sm text-[#0B3C5D] bg-transparent outline-none opacity-50 cursor-not-allowed"
                                    value={formData.weight}
                                />
                                <span className="text-[10px] font-black text-slate-300 ml-1">PTS</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            Higher weights exert more influence on the project's overall progress calculation. Standard tasks are 1pt.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                        <textarea
                            placeholder="Detail the task objectives and requirements..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-500">
                            <AlertCircle size={18} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.02] shadow-xl shadow-[#0B3C5D]/20 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : (
                            <>
                                <CheckCircle2 size={18} />
                                Confirm Task Assignment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const TaskDetailsModal = ({ task, onClose, onEdit }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100 p-10 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-[#0B3C5D]">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight">{task.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${task.status === 'done' ? 'bg-[#63C132]/10 text-[#63C132]' :
                                    task.status === 'in-progress' ? 'bg-blue-50 text-blue-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    {task.status}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${task.priority === 'urgent' ? 'text-rose-500' :
                                    task.priority === 'high' ? 'text-amber-500' :
                                        'text-blue-500'
                                    }`}>
                                    {task.priority} Priority
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-300 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Briefcase size={14} className="text-blue-500" /> Project Context
                            </div>
                            <div className="text-sm font-bold text-[#0B3C5D]">{task.project?.name || 'N/A'}</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <User size={14} className="text-[#63C132]" /> Assigned To
                            </div>
                            <div className="flex items-center gap-3 font-bold text-[#0B3C5D]">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] border border-slate-100 shadow-sm">
                                    {task.assignedTo?.name?.split(' ').map(n => n[0]).join('')}
                                </div>
                                {task.assignedTo?.name}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar size={14} className="text-rose-500" /> Strategy Deadline
                            </div>
                            <div className="text-sm font-bold text-[#0B3C5D]">
                                {new Date(task.deadline).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                        </div>
                        <div className="bg-[#63C132]/5 p-6 rounded-3xl border border-[#63C132]/10 space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest">
                                <Scale size={14} className="text-[#63C132]" /> Execution Weight
                            </div>
                            <div className="text-sm font-bold text-[#0B3C5D]">
                                {task.weight || 1} Impact Points
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Objectives & Description</div>
                    <div className="bg-slate-50 p-8 rounded-[32px] text-sm text-slate-600 font-medium leading-relaxed min-h-[120px]">
                        {task.description || "No description provided."}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 text-[#0B3C5D] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        Close Details
                    </button>
                    <button
                        onClick={() => onEdit(task)}
                        className="flex-1 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all shadow-xl shadow-[#0B3C5D]/20"
                    >
                        Edit Task
                    </button>
                </div>
            </div>
        </div>
    );
};

import { useNavigate, useLocation } from 'react-router-dom';

const TaskManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [tasks, setTasks] = useState(() => {
        const cached = localStorage.getItem('ls_tl_tasks_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [projects, setProjects] = useState(() => {
        const cached = localStorage.getItem('ls_tl_projects_brief');
        return cached ? JSON.parse(cached) : [];
    });
    const [members, setMembers] = useState(() => {
        const cached = localStorage.getItem('ls_tl_team_members');
        if (!cached) return [];
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : (parsed.members || []);
    });
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(tasks.length === 0 && projects.length === 0);
    const [filter, setFilter] = useState('all'); // all, todo, in-progress, done, overdue
    const [searchQuery, setSearchQuery] = useState(location.state?.assigneeName || '');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [tasksRes, projectsRes, membersRes] = await Promise.all([
                API.get('/team-lead/tasks'),
                API.get('/team-lead/projects'),
                API.get('/team-lead/team')
            ]);
            setTasks(tasksRes.data);
            setProjects(projectsRes.data);

            // Extract members array from potential object response
            const membersData = membersRes.data.members || membersRes.data;
            setMembers(membersData);

            localStorage.setItem('ls_tl_tasks_list', JSON.stringify(tasksRes.data));
            localStorage.setItem('ls_tl_projects_brief', JSON.stringify(projectsRes.data));
            // Keep the full object in localStorage if it exists for MyTeam.jsx consistency
            localStorage.setItem('ls_tl_team_members', JSON.stringify(membersRes.data));

            setLoading(false);
        } catch (error) {
            console.error("Fetch data error:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Clear location state after reading
        if (location.state) {
            window.history.replaceState({}, document.title);
        }
    }, [fetchData, location.state]);

    useSocketListener('task:assigned', fetchData);
    useSocketListener('task:created', fetchData);
    useSocketListener('task:updated', fetchData);
    useSocketListener('task:deleted', fetchData);

    const filteredTasks = tasks.filter(task => {
        const matchesStatus = filter === 'all'
            ? true
            : filter === 'overdue'
                ? (new Date(task.deadline) < new Date() && task.status !== 'done')
                : task.status === filter;

        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
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

    const handleMarkDone = async (taskId) => {
        try {
            await API.put(`/team-lead/tasks/${taskId}`, { status: 'done' });
            fetchData();
        } catch (error) {
            console.error("Failed to mark task as done:", error);
        }
    };

    if (loading) return <div className="space-y-4 animate-pulse p-10">
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
                    onClick={() => {
                        setSelectedTask(null);
                        setShowAssignModal(true);
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.05] shadow-xl shadow-[#0B3C5D]/20"
                >
                    <Plus size={18} />
                    Assign New Task
                </button>
            </div>

            {/* KPI Stats */}
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

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'todo', 'in-progress', 'review', 'done', 'overdue'].map((f) => (
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
                            className="pl-12 pr-12 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#0B3C5D]/10 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
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
                                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                            <Briefcase size={10} /> {task.project?.name}
                                            <span className="mx-2">•</span>
                                            <Scale size={10} /> {task.weight || 1} pts
                                        </div>
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
                                    <div className="flex items-center justify-end gap-2">
                                        {task.status === 'review' && (
                                            <button
                                                onClick={() => handleMarkDone(task._id)}
                                                className="px-3 py-2 bg-[#63C132] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#56ab2b] transition-all"
                                            >
                                                Mark Done
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowDetailsModal(true);
                                            }}
                                            className="p-2 text-slate-300 hover:text-[#0B3C5D] hover:bg-white rounded-xl transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
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


            {showAssignModal && (
                <AssignTaskModal
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedTask(null);
                    }}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        setSelectedTask(null);
                        fetchData();
                    }}
                    projects={projects}
                    members={members}
                    taskToEdit={selectedTask}
                />
            )}

            {showDetailsModal && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedTask(null);
                    }}
                    onEdit={(task) => {
                        setShowDetailsModal(false);
                        setSelectedTask(task);
                        setShowAssignModal(true);
                    }}
                />
            )}
        </div>
    );
};

export default TaskManagement;
