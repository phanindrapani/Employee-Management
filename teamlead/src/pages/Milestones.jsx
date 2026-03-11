import React, { useState, useEffect } from 'react';
import {
    Target,
    Plus,
    Search,
    Briefcase,
    Calendar,
    LayoutGrid,
    Clock,
    TrendingUp,
    Activity
} from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';

const Milestones = () => {
    const navigate = useNavigate();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchMilestones = async () => {
            try {
                const { data } = await API.get('/team-lead/milestones');
                setMilestones(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch team milestones:", error);
                setLoading(false);
            }
        };
        fetchMilestones();
    }, []);

    const filteredMilestones = milestones.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUpdateStatus = async (milestoneId, newStatus) => {
        try {
            const { data } = await API.patch(`/team-lead/milestones/${milestoneId}/status`, { status: newStatus });
            setMilestones(milestones.map(m => m._id === milestoneId ? data : m));
        } catch (error) {
            console.error("Failed to update milestone status:", error);
            alert("Failed to update milestone status.");
        }
    };

    const handleCreateTask = (milestone) => {
        navigate('/tasks', {
            state: {
                preFillTask: true,
                project: milestone.projectId,
                milestone: milestone
            }
        });
    };

    if (loading) return (
        <div className="space-y-4 animate-pulse p-4 md:p-10">
            <div className="h-20 bg-white rounded-3xl"></div>
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white rounded-2xl"></div>)}
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0B3C5D] tracking-tight mb-2 uppercase tracking-widest">My Milestones</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium italic">Project Planning • Phase Tracking</p>
                </div>
                <div className="p-4 bg-[#63C132]/10 rounded-2xl border border-[#63C132]/20 flex items-center gap-3">
                    <TrendingUp className="text-[#63C132]" size={20} />
                    <div>
                        <div className="text-[10px] font-black text-[#0B3C5D] uppercase tracking-widest leading-none">Global Progress</div>
                        <div className="text-sm font-bold text-[#0B3C5D]">Aggregated Completion</div>
                    </div>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <StatCard
                    title="Total Milestones"
                    value={milestones.length}
                    colorClass="border-blue-500"
                    titleColor="text-blue-500"
                />
                <StatCard
                    title="Active Projects"
                    value={new Set(milestones.map(m => m.projectId?._id)).size}
                    colorClass="border-amber-500"
                    titleColor="text-amber-500"
                />
                <StatCard
                    title="Project Coverage"
                    value={`${Math.round((milestones.length / (milestones.length + 2)) * 100)}%`}
                    colorClass="border-[#63C132]"
                    titleColor="text-[#63C132]"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search milestones or projects..."
                        className="w-full pl-12 pr-10 py-3 bg-slate-50 border-none rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-[#0B3C5D]/10 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    <LayoutGrid size={14} /> View: Board Matrix
                </div>
            </div>

            {/* Milestones Grid/Table */}
            <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestone Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Progress</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMilestones.length > 0 ? filteredMilestones.map((milestone) => (
                                <tr key={milestone._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 rounded-2xl text-[#0B3C5D] group-hover:bg-[#0B3C5D] group-hover:text-white transition-all transform group-hover:rotate-12">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#0B3C5D] text-lg truncate max-w-[200px]">{milestone.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Tracking ID: {milestone.milestoneId || milestone._id.slice(-6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                                                <Briefcase size={12} />
                                            </div>
                                            <span className="font-bold text-slate-600 italic tracking-tight">{milestone.projectId?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none appearance-none cursor-pointer ${
                                                milestone.status === 'completed' ? 'bg-[#63C132]/10 text-[#63C132] border-[#63C132]/20' :
                                                milestone.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}
                                            value={milestone.status || 'pending'}
                                            onChange={(e) => handleUpdateStatus(milestone._id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex-1 shadow-inner">
                                                <div className="h-full bg-[#63C132] rounded-full" style={{ width: `${milestone.progress}%` }}></div>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 text-right">{milestone.progress}% Complete</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                <Calendar size={12} className="text-blue-500" />
                                                Created: {new Date(milestone.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-[#0B3C5D] font-bold text-xs uppercase tracking-widest">
                                                <Clock size={12} className={new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed' ? "text-rose-500" : "text-amber-500"} />
                                                Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No Deadine'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right text-right">
                                        <button
                                            onClick={() => handleCreateTask(milestone)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3C5D] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.05] shadow-lg shadow-[#0B3C5D]/20 active:scale-95"
                                        >
                                            <Plus size={14} />
                                            <span>Create Task</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                                        <div className="flex flex-col items-center gap-4">
                                            <Clock size={40} className="text-slate-100" />
                                            No milestones successfully assigned to your team yet.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Milestones;
