import React, { useState, useEffect } from 'react';
import API from '../api';
import { Briefcase, Clock, CheckCircle2, AlertCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, statsRes] = await Promise.all([
                    API.get('/manager/projects'),
                    API.get('/manager/projects/stats')
                ]);
                setProjects(projRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to fetch projects', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#63C132', '#0B3C5D', '#F59E0B', '#EF4444', '#64748B'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-[#63C132] bg-[#63C132]/10';
            case 'ongoing': return 'text-[#0B3C5D] bg-[#0B3C5D]/10';
            case 'on-hold': return 'text-amber-600 bg-amber-50';
            case 'cancelled': return 'text-red-600 bg-red-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Projects...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white shadow-xl shadow-[#0B3C5D]/5 rounded-2xl text-[#0B3C5D]">
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#0B3C5D]">Projects Overview</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Strategic oversight of active initiatives</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Projects List */}
                <div className="lg:col-span-2 space-y-4">
                    {projects.length === 0 ? (
                        <div className="bg-white p-12 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                            <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No projects assigned to your teams</p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div key={project._id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 hover:shadow-xl hover:shadow-[#0B3C5D]/5 transition-all group">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                ID: {project._id.slice(-6)}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-[#0B3C5D] mb-1 group-hover:text-[#63C132] transition-colors">{project.name}</h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-1">{project.description}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 items-center">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={14} />
                                                <span className="text-xs font-bold uppercase tracking-tighter">
                                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[#0B3C5D]">
                                                <BarChart3 size={14} />
                                                <span className="text-xs font-black uppercase tracking-widest">{project.assignedTeam?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:w-48 flex flex-col justify-center items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-6">
                                        <div className="text-center md:text-right w-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                                                <span className="text-sm font-black text-[#63C132]">{project.progress}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#63C132] to-[#52A428] rounded-full transition-all duration-1000 shadow-lg"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Status Breakdown Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 sticky top-8">
                        <h3 className="text-lg font-black text-[#0B3C5D] mb-6 flex items-center gap-3">
                            <PieChart size={20} className="text-[#63C132]" />
                            Status Breakdown
                        </h3>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="_id"
                                    >
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 space-y-3">
                            {stats.map((stat, index) => (
                                <div key={stat._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{stat._id}</span>
                                    </div>
                                    <span className="text-xs font-black text-[#0B3C5D] group-hover:scale-110 transition-transform">{stat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Projects;
