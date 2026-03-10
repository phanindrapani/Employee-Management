import React, { useState, useEffect } from 'react';
import API from '../api';
import StatCard from '../components/StatCard';
import {
    FolderKanban,
    CheckCircle2,
    Clock,
    AlertOctagon,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, FunnelChart, Funnel, LabelList
} from 'recharts';

const ProjectReports = () => {
    const [projects, setProjects] = useState(() => {
        const cached = localStorage.getItem('ls_admin_projects_list');
        return cached ? JSON.parse(cached) : [];
    });
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('ls_admin_project_reports_stats');
        return cached ? JSON.parse(cached) : {
            total: 0,
            completed: 0,
            ongoing: 0,
            delayed: 0,
            upcoming: 0
        };
    });
    const [loading, setLoading] = useState(projects.length === 0);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await API.get('/admin/projects');
                setProjects(data);
                localStorage.setItem('ls_admin_projects_list', JSON.stringify(data));

                // Calculate stats
                const total = data.length;
                const completed = data.filter(p => p.status === 'completed').length;
                const ongoing = data.filter(p => p.status === 'ongoing').length;
                const delayed = data.filter(p => new Date(p.endDate) < new Date() && p.status !== 'completed').length;
                const upcoming = data.filter(p => p.status === 'upcoming').length;

                const newStats = { total, completed, ongoing, delayed, upcoming };
                setStats(newStats);
                localStorage.setItem('ls_admin_project_reports_stats', JSON.stringify(newStats));
            } catch (err) {
                console.error('Failed to fetch project stats');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    if (loading) return <div className="text-center py-10 text-slate-400">Loading analytics...</div>;

    const statusData = [
        { name: 'Completed', value: stats.completed, fill: '#22c55e' },
        { name: 'Ongoing', value: stats.ongoing, fill: '#3b82f6' },
        { name: 'Delayed', value: stats.delayed, fill: '#8b5cf6' },
        { name: 'Upcoming', value: stats.upcoming, fill: '#ef4444' },
        { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, fill: '#f59e0b' }
    ].filter(item => item.value > 0);

    const progressData = projects
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) // Recent first
        .slice(0, 5)
        .map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
            progress: p.progress,
            status: p.status,
            fill: p.status === 'completed' ? '#22c55e' : p.status === 'delayed' ? '#ef4444' : '#0B3C5D'
        }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <PieChartIcon size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Project Analytics</h1>
                    <p className="text-slate-500 font-medium">Insights into project performance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Projects" value={stats.total} colorClass="border-blue-500" titleColor="text-blue-500" />
                <StatCard title="Completed" value={stats.completed} colorClass="border-green-500" titleColor="text-green-500" />
                <StatCard title="Ongoing" value={stats.ongoing} colorClass="border-amber-500" titleColor="text-amber-500" />
                <StatCard title="Upcoming" value={stats.upcoming} colorClass="border-purple-500" titleColor="text-purple-500" />
                <StatCard title="Delayed" value={stats.delayed} colorClass="border-red-500" titleColor="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution Chart */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold mb-6">Status Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Funnel
                                    dataKey="value"
                                    data={statusData}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Progress Chart */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold mb-6">Recent Projects Progress</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="progress" fill="#0B3C5D" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectReports;
