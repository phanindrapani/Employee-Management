import { useState, useEffect } from 'react';
import {
    ClipboardList,
    Calendar,
    ChevronRight,
    Search,
    FolderKanban,
    X,
    MessageCircle,
    RefreshCw
} from 'lucide-react';
import API from '../../api';

const TaskDetailsModal = ({ task, onClose, onUpdate }) => {
    if (!task) return null;

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
            case 'high': return 'text-rose-500 bg-rose-50 border-rose-100';
            case 'medium': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'low': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);

    const handleUpdateStatus = async (newStatus) => {
        setIsUpdating(true);
        setError(null);
        try {
            const { data } = await API.patch(`/employee/tasks/${task._id}/status`, { status: newStatus });
            onUpdate(data);
            setIsUpdating(false);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update status");
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-slate-100">
                {/* Status Bar */}
                <div className="h-2 w-full bg-slate-100">
                    <div
                        className={`h-full transition-all duration-1000 ${getStatusStyles(task.status).split(' ')[1].replace('text-', 'bg-')}`}
                        style={{ width: task.status === 'done' ? '100%' : task.status === 'review' ? '75%' : task.status === 'in-progress' ? '50%' : '25%' }}
                    ></div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(task.status)}`}>
                                    {task.status}
                                </span>
                                <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                    {task.priority} Priority
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mt-4 leading-tight">{task.title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <FolderKanban size={10} /> Project
                            </p>
                            <p className="text-[#0B3C5D] font-black text-xs truncate">{task.project?.name || 'Main Project'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Calendar size={10} /> Due Date
                            </p>
                            <p className="text-[#0B3C5D] font-black text-xs">{new Date(task.deadline).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <MessageCircle size={12} /> Task Description
                        </div>
                        <div className="p-6 bg-[#F8FAFC] rounded-[32px] border border-slate-100 min-h-[120px]">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                {task.description || 'No detailed description provided for this task.'}
                            </p>
                        </div>
                    </div>

                    {/* Update Status Actions */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Status</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['todo', 'in-progress', 'review', 'done'].map((s) => (
                                <button
                                    key={s}
                                    disabled={isUpdating || task.status === s}
                                    onClick={() => handleUpdateStatus(s)}
                                    className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${task.status === s
                                        ? 'bg-[#0B3C5D] text-white border-[#0B3C5D]'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-[#63C132] hover:text-[#63C132]'
                                        }`}
                                >
                                    {isUpdating && task.status !== s ? <RefreshCw size={12} className="animate-spin mx-auto" /> : s.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                        {error && <p className="text-[10px] text-rose-500 font-bold text-center">{error}</p>}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-[#0B3C5D] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyTasks = () => {
    const [tasks, setTasks] = useState(() => {
        const cached = localStorage.getItem('ls_emp_my_tasks');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(tasks.length === 0);
    const [selectedTask, setSelectedTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeTab, setActiveTab] = useState('All Tasks');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Fetch tasks assigned to the current employee
                const { data } = await API.get('/employee/tasks');
                setTasks(data);
                localStorage.setItem('ls_emp_my_tasks', JSON.stringify(data));
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

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTab =
            activeTab === 'All Tasks' ? true :
                activeTab === 'Pending' ? task.status !== 'done' :
                    activeTab === 'Completed' ? task.status === 'done' : true;

        return matchesSearch && matchesTab;
    });

    if (loading) return <div className="p-8 animate-pulse space-y-4">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100"></div>)}
        </div>
    </div>;

    return (
        <div className="p-4 md:p-8 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">My Tasks</h1>
                    <p className="text-slate-500 font-medium text-sm italic">Individual action items • Synced from Cloud</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#63C132] text-sm font-medium shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Task Filters */}
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
                {['All Tasks', 'Pending', 'Completed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[#0B3C5D] shadow-sm' : 'text-slate-500 hover:text-[#0B3C5D]'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.map((task) => (
                    <div key={task._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex flex-col md:flex-row items-center gap-6 cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <div className={`w-1.5 h-12 rounded-full ${getStatusStyles(task.status).split(' ')[1].replace('text-', 'bg-')}`}></div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-slate-800 truncate group-hover:text-[#63C132] transition-colors">{task.title}</h3>
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

                            <button className="p-3 bg-slate-50 text-[#0B3C5D] rounded-xl group-hover:bg-[#63C132] group-hover:text-white transition-all transform hover:scale-110">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && !loading && (
                    <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ClipboardList size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">{searchTerm ? 'No Tasks Found' : 'All Caught Up!'}</h3>
                        <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">
                            {searchTerm ? 'Try adjusting your search terms.' : 'You have no pending tasks. Check back later or enjoy your free time.'}
                        </p>
                    </div>
                )}
            </div>

            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updatedTask) => {
                        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
                        setSelectedTask(updatedTask);
                    }}
                />
            )}
        </div>
    );
};

export default MyTasks;
