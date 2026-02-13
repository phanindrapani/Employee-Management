import React, { useState, useEffect } from 'react';
import API from '../api';
import StatCard from '../components/StatCard';
import {
    FolderKanban,
    CheckCircle2,
    Clock,
    AlertOctagon,
    PieChart
} from 'lucide-react';

const ProjectReports = () => {
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        ongoing: 0,
        delayed: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await API.get('/admin/projects');
                setProjects(data);

                // Calculate stats
                const total = data.length;
                const completed = data.filter(p => p.status === 'completed').length;
                const ongoing = data.filter(p => p.status === 'ongoing').length;
                const delayed = data.filter(p => new Date(p.endDate) < new Date() && p.status !== 'completed').length;

                setStats({ total, completed, ongoing, delayed });
            } catch (err) {
                console.error('Failed to fetch project stats');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    if (loading) return <div className="text-center py-10 text-slate-400">Loading analytics...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <PieChart size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Project Analytics</h1>
                    <p className="text-slate-500 font-medium">Insights into project performance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Projects" value={stats.total} icon={FolderKanban} colorClass="bg-blue-50 text-blue-600" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} colorClass="bg-green-50 text-green-600" />
                <StatCard title="Ongoing" value={stats.ongoing} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
                <StatCard title="Delayed" value={stats.delayed} icon={AlertOctagon} colorClass="bg-red-50 text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">Status Distribution</h3>
                    <div className="space-y-4">
                        {['completed', 'ongoing', 'on-hold', 'cancelled'].map(status => {
                            const count = projects.filter(p => p.status === status).length;
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={status} className="space-y-2">
                                    <div className="flex justify-between text-sm uppercase font-bold text-slate-500">
                                        <span>{status}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${status === 'completed' ? 'bg-green-500' :
                                                    status === 'ongoing' ? 'bg-blue-500' :
                                                        status === 'on-hold' ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">High Priority Projects</h3>
                    <div className="space-y-4">
                        {projects.filter(p => p.priority === 'high').slice(0, 5).map(p => (
                            <div key={p._id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                                <div>
                                    <div className="font-bold text-[#0B3C5D]">{p.name}</div>
                                    <div className="text-xs text-red-600 font-bold uppercase">{p.status}</div>
                                </div>
                                <div className="text-sm font-bold text-[#0B3C5D]">
                                    {p.progress}%
                                </div>
                            </div>
                        ))}
                        {projects.filter(p => p.priority === 'high').length === 0 && (
                            <p className="text-slate-400 italic">No high priority projects</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectReports;
