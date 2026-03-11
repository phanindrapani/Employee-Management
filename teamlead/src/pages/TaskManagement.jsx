import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    User,
    ClipboardList,
    X,
    Scale,
    Briefcase,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    Target,
    MessageSquare,
    Activity
} from 'lucide-react';
import API from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import useSocketListener from '../hooks/useSocketListener';
import StatCard from '../components/StatCard';

const AssignTaskModal = ({ onClose, onSuccess, selectedProject, selectedMilestone, projects, members, taskToEdit }) => {
    const [formData, setFormData] = useState({
        title: taskToEdit?.title || '',
        description: taskToEdit?.description || '',
        project: taskToEdit?.project?._id || taskToEdit?.project || selectedProject?._id || '',
        assignedTo: taskToEdit?.assignedTo?._id || taskToEdit?.assignedTo || '',
        milestoneId: taskToEdit?.milestoneId?._id || taskToEdit?.milestoneId || selectedMilestone?._id || '',
        teamId: taskToEdit?.teamId || '',
        deadline: taskToEdit?.deadline ? new Date(taskToEdit.deadline).toISOString().split('T')[0] : '',
        priority: taskToEdit?.priority || 'medium',
        weight: taskToEdit?.weight || 1
    });
    const [milestones, setMilestones] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMilestones = async () => {
            if (formData.project) {
                try {
                    const { data } = await API.get(`/team-lead/milestones/project/${formData.project}`);
                    setMilestones(data);
                } catch (err) {
                    console.error('Failed to fetch milestones', err);
                }
            } else {
                setMilestones([]);
            }
        };
        fetchMilestones();
    }, [formData.project]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full md:max-w-xl md:rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100 max-h-[100dvh] md:max-h-[90vh] min-h-screen md:min-h-0 flex flex-col">
                <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 md:p-3 bg-blue-50 rounded-xl md:rounded-2xl text-[#0B3C5D]">
                            {taskToEdit ? <ClipboardList size={20} className="md:size-[24px]" /> : <Plus size={20} className="md:size-[24px]" />}
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-[#0B3C5D] tracking-tight">
                                {taskToEdit ? 'Edit Tactical Task' : 'Assign New Task'}
                            </h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Deployment Operations</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-300 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-4 md:space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-32 md:pb-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter task objective..."
                            className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Context</label>
                            <select
                                required
                                disabled={!!selectedProject && !taskToEdit}
                                className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none ${!!selectedProject && !taskToEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.project}
                                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Milestone Phase</label>
                            <select
                                required
                                disabled={!!selectedMilestone && !taskToEdit}
                                className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none ${!!selectedMilestone && !taskToEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.milestoneId}
                                onChange={(e) => setFormData({ ...formData, milestoneId: e.target.value })}
                            >
                                <option value="">Select Milestone</option>
                                {milestones.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Member</label>
                            <select
                                required
                                className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            >
                                <option value="">Select Assignee</option>
                                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Execution Deadline</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Matrix</label>
                            <select
                                required
                                className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                                <option value="urgent">Critical/Urgent</option>
                            </select>
                        </div>
                        <div className="p-4 md:p-6 bg-[#63C132]/5 rounded-[24px] md:rounded-[32px] border border-[#63C132]/10 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest leading-none">
                                    <Scale size={14} className="text-[#63C132]" /> Task weight
                                </div>
                                <div className="flex bg-white px-2 py-1 rounded-lg border border-slate-100 items-center">
                                    <input
                                        type="number"
                                        readOnly
                                        disabled
                                        className="w-8 text-center font-black text-xs text-[#0B3C5D] bg-transparent outline-none opacity-50 cursor-not-allowed"
                                        value={formData.weight}
                                    />
                                    <span className="text-[8px] font-black text-slate-300 ml-1">PTS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                        <textarea
                            placeholder="Detail objective and requirements..."
                            className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none min-h-[80px] md:min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="p-3 md:p-4 bg-rose-50 rounded-xl md:rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-500">
                            <AlertCircle size={16} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">{error}</span>
                        </div>
                    )}

                    <div className="fixed md:static bottom-0 left-0 right-0 p-6 md:p-0 bg-white md:bg-transparent border-t md:border-t-0 border-slate-100 sticky bottom-0 z-20">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 md:py-5 bg-[#0B3C5D] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all transform md:hover:scale-[1.02] shadow-xl shadow-[#0B3C5D]/20 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>Confirm Assignment</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TaskDetailsModal = ({ task, onClose, onEdit }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full md:max-w-2xl md:rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100 p-6 md:p-10 space-y-6 md:space-y-8 max-h-[100dvh] md:max-h-[90vh] min-h-screen md:min-h-0 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="p-2 md:p-3 bg-blue-50 rounded-xl md:rounded-2xl text-[#0B3C5D] flex-shrink-0">
                            <ClipboardList size={20} className="md:size-[24px]" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="text-lg md:text-2xl font-black text-[#0B3C5D] tracking-tight truncate">{task.title}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${task.status === 'done' ? 'bg-[#63C132]/10 text-[#63C132]' :
                                    task.status === 'in-progress' ? 'bg-blue-50 text-blue-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    {task.status}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${task.priority === 'urgent' ? 'text-rose-500' :
                                    task.priority === 'high' ? 'text-amber-500' :
                                        'text-blue-500'
                                    }`}>
                                    {task.priority} Priority
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-300 rounded-full transition-all flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 md:space-y-8 custom-scrollbar pb-24 md:pb-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] md:rounded-3xl space-y-2">
                                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    <Briefcase size={12} className="text-blue-500" /> Project Context
                                </div>
                                <div className="text-sm font-bold text-[#0B3C5D] truncate">{task.project?.name || 'N/A'}</div>
                            </div>
                            <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] md:rounded-3xl space-y-2">
                                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    <Target size={12} className="text-amber-500" /> Milestone Phase
                                </div>
                                <div className="text-sm font-bold text-[#0B3C5D] truncate">{task.milestoneId?.name || 'N/A'}</div>
                            </div>
                            <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] md:rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    <User size={12} className="text-[#63C132]" /> Assigned To
                                </div>
                                <div className="flex items-center gap-3 font-bold text-[#0B3C5D]">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] border border-slate-100 shadow-sm flex-shrink-0">
                                        {task.assignedTo?.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="truncate">{task.assignedTo?.name}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] md:rounded-3xl space-y-2">
                                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    <Calendar size={12} className="text-rose-500" /> Resolution Deadline
                                </div>
                                <div className="text-sm font-bold text-[#0B3C5D]">
                                    {new Date(task.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </div>
                            </div>
                            <div className="bg-[#63C132]/5 p-4 md:p-6 rounded-[24px] md:rounded-3xl border border-[#63C132]/10 space-y-2">
                                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest leading-none">
                                    <Scale size={12} className="text-[#63C132]" /> Impact Points
                                </div>
                                <div className="text-sm font-bold text-[#0B3C5D]">
                                    {task.weight || 1} PTS
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            <Activity size={14} className="text-blue-500" /> Task Progress
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[24px] space-y-4">
                            <div className="flex justify-between text-xs font-bold text-[#0B3C5D]">
                                <span>Completion Status</span>
                                <span>{task.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 md:h-3 overflow-hidden">
                                <div
                                    className="bg-[#63C132] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${task.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Objectives</div>
                        <div className="bg-slate-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-xs md:text-sm text-slate-600 font-medium leading-relaxed min-h-[100px] md:min-h-[120px]">
                            {task.description || "No specific instructions provided."}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            <MessageSquare size={14} className="text-amber-500" /> Operational Updates
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[24px] space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((comment, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[#0B3C5D] font-bold text-[10px] overflow-hidden">
                                            {comment.user?.profilePicture ? (
                                                <img src={comment.user.profilePicture} alt={comment.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                comment.user?.name?.split(' ').map(n => n[0]).join('')
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-[#0B3C5D]">{comment.user?.name || 'Unknown User'}</span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-slate-400 font-medium text-xs">No updates or comments provided yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="fixed md:static bottom-0 left-0 right-0 p-6 md:p-0 bg-white md:bg-transparent border-t md:border-t-0 border-slate-100 flex gap-4 mt-auto">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 text-[#0B3C5D] rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onEdit(task)}
                        className="flex-1 py-4 bg-[#0B3C5D] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all shadow-xl shadow-[#0B3C5D]/20 font-bold"
                    >
                        Modify Task
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(tasks.length === 0 && projects.length === 0);
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [filter, setFilter] = useState('all');
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
            const membersData = membersRes.data.members || membersRes.data;
            setMembers(membersData);
            localStorage.setItem('ls_tl_tasks_list', JSON.stringify(tasksRes.data));
            localStorage.setItem('ls_tl_projects_brief', JSON.stringify(projectsRes.data));
            localStorage.setItem('ls_tl_team_members', JSON.stringify(membersRes.data));
            setLoading(false);
        } catch (error) {
            console.error("Fetch data error:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        if (location.state) {
            if (location.state.preFillTask) {
                setSelectedProject(location.state.project);
                setSelectedMilestone(location.state.milestone);
                setShowAssignModal(true);
            }
            window.history.replaceState({}, document.title);
        }
    }, [fetchData, location.state]);

    useEffect(() => {
        const fetchMilestones = async () => {
            if (selectedProject) {
                setMilestonesLoading(true);
                try {
                    const { data } = await API.get(`/team-lead/milestones/project/${selectedProject._id}`);
                    setMilestones(data);
                } catch (err) {
                    console.error('Failed to fetch milestones', err);
                } finally {
                    setMilestonesLoading(false);
                }
            } else {
                setMilestones([]);
                setSelectedMilestone(null);
            }
        };
        fetchMilestones();
    }, [selectedProject]);

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

        const matchesProject = selectedProject ? task.project?._id === selectedProject._id : true;
        const matchesMilestone = selectedMilestone ? task.milestoneId?._id === selectedMilestone._id : true;

        return matchesStatus && matchesSearch && matchesProject && matchesMilestone;
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

    if (loading) return <div className="space-y-4 animate-pulse p-4 md:p-10">
        <div className="h-20 bg-white rounded-3xl"></div>
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white rounded-2xl"></div>)}
    </div>;

    return (
        <div className="flex flex-col gap-8">
            {/* Main Content Area */}
            <div className="w-full space-y-6 md:space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#0B3C5D] tracking-tight mb-2">
                            {selectedProject ? selectedProject.name : 'Task Operations'}
                        </h1>
                        <div className="flex items-center gap-3">
                            <p className="text-sm md:text-base text-slate-500 font-medium italic">
                                {selectedMilestone ? `Phase: ${selectedMilestone.name}` : selectedProject ? 'Tactical Project Control' : 'Daily Control • Assignment & Review'}
                            </p>
                            {selectedProject && (
                                <button
                                    onClick={() => {
                                        setSelectedProject(null);
                                        setSelectedMilestone(null);
                                    }}
                                    className="px-2 py-1 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    <X size={12} /> Clear Context
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedTask(null);
                            setShowAssignModal(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-[#63C132] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#52A428] transition-all transform md:hover:scale-[1.05] shadow-xl shadow-[#63C132]/20"
                    >
                        <Plus size={18} />
                        <span>{selectedMilestone ? 'Phase Assignment' : 'Assign New Task'}</span>
                    </button>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <StatCard
                        title="Completed"
                        value={filteredTasks.filter(t => t.status === 'done').length}
                        colorClass="border-green-500"
                        titleColor="text-green-600"
                    />
                    <StatCard
                        title="In Progress"
                        value={filteredTasks.filter(t => t.status === 'in-progress').length}
                        colorClass="border-blue-500"
                        titleColor="text-blue-500"
                    />
                    <StatCard
                        title="Urgent Attention"
                        value={filteredTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length}
                        colorClass="border-rose-500"
                        titleColor="text-rose-500"
                    />
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap md:flex-nowrap gap-4 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-2 px-2">
                        {['all', 'todo', 'in-progress', 'review', 'done', 'overdue'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-[#0B3C5D] text-white shadow-md'
                                    : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                {f.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-12 pr-10 py-2.5 md:py-3 bg-slate-50 border-none rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Task Table */}
                <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                                <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 md:px-8 py-4 md:py-6">
                                        <div className="max-w-[150px] md:max-w-none">
                                            <div className="font-bold text-[#0B3C5D] group-hover:text-[#63C132] transition-colors truncate">{task.title}</div>
                                            <div className="text-[10px] md:text-xs text-slate-400 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                                                <Briefcase size={10} className="flex-shrink-0" /> <span className="truncate">{task.project?.name || 'General'}</span>
                                                <span className="mx-2 text-slate-200">•</span>
                                                <Target size={10} className="flex-shrink-0" /> <span className="truncate">{task.milestoneId?.name || 'N/A'}</span>
                                                <span className="mx-2 text-slate-200">•</span>
                                                <Scale size={10} className="flex-shrink-0" /> {task.weight || 1} pts
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 md:py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center text-[9px] md:text-[10px] font-black text-[#0B3C5D] flex-shrink-0">
                                                {task.assignedTo?.name?.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-semibold text-slate-600 truncate max-w-[100px]">{task.assignedTo?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 md:py-6">
                                        <div className={`flex items-center gap-2 font-bold whitespace-nowrap ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-rose-500' : 'text-slate-500'}`}>
                                            <Calendar size={14} className="flex-shrink-0" />
                                            <span className="text-xs md:text-[13px]">{new Date(task.deadline).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 md:py-6">
                                        <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${getStatusStyle(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {task.status === 'review' && (
                                                <button onClick={() => handleMarkDone(task._id)} className="px-2.5 py-1.5 md:px-3 md:py-2 bg-[#63C132] text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#56ab2b] shadow-sm">
                                                    Done
                                                </button>
                                            )}
                                            <button onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }} className="p-2 text-slate-300 hover:text-[#0B3C5D] hover:bg-slate-50 rounded-lg transition-all">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No tasks found for this context</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showAssignModal && (
                    <AssignTaskModal
                        onClose={() => { setShowAssignModal(false); setSelectedTask(null); }}
                        onSuccess={() => { setShowAssignModal(false); setSelectedTask(null); fetchData(); }}
                        selectedProject={selectedProject}
                        selectedMilestone={selectedMilestone}
                        projects={projects}
                        members={members}
                        taskToEdit={selectedTask}
                    />
                )}

                {showDetailsModal && (
                    <TaskDetailsModal
                        task={selectedTask}
                        onClose={() => { setShowDetailsModal(false); setSelectedTask(null); }}
                        onEdit={(task) => { setShowDetailsModal(false); setSelectedTask(task); setShowAssignModal(true); }}
                    />
                )}
            </div>
        </div>
    );
};

export default TaskManagement;
