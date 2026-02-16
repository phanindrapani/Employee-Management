import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
    Download,
    TrendingUp,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const Reports = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(() => {
        const cached = localStorage.getItem('ls_admin_reports_data');
        return cached ? JSON.parse(cached) : {
            summary: {
                totalLeaves: 0,
                avgDuration: 0,
                mostCommonType: 'N/A',
                utilizationRate: 0
            },
            monthlyData: [],
            employeeStats: [],
            leaveDistribution: []
        };
    });
    const [loading, setLoading] = useState(!reportData.monthlyData?.length);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data } = await API.get('/admin/reports');
                setReportData(data);
                localStorage.setItem('ls_admin_reports_data', JSON.stringify(data));
            } catch (err) {
                console.error('Failed to fetch reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const handleDownload = () => {
        const { summary, employeeStats } = reportData;

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Report Summary\n";
        csvContent += `Total Leaves,${summary.totalLeaves}\n`;
        csvContent += `Average Duration,${summary.avgDuration} Days\n`;
        csvContent += `Most Common Type,${summary.mostCommonType}\n`;
        csvContent += `Utilization Rate,${summary.utilizationRate}%\n\n`;

        csvContent += "Top Employees by Leave Usage\n";
        csvContent += "Name,Leaves Requested,Total Days\n";

        employeeStats.forEach(emp => {
            csvContent += `${emp.name},${emp.leaves},${emp.days}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leave_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-10 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Leave Analytics</h1>
                    <p className="text-slate-500 font-medium italic">Summary of leave data</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-3 px-6 py-4 bg-[#0B3C5D] text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-[#1A4B6D] transition-all shadow-xl shadow-[#0B3C5D]/20 active:scale-95"
                >
                    <Download size={20} />
                    Download Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leaves</span>
                        <div className="p-2 bg-[#F0FFF4] text-[#63C132] rounded-xl shadow-inner">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D] tracking-tight mb-1">{reportData.summary.totalLeaves}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">Approved this year</div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Leave</span>
                        <div className="p-2 bg-[#FFF5F5] text-[#E53E3E] rounded-xl shadow-inner">
                            <ArrowDownRight size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D] tracking-tight mb-1">{reportData.summary.avgDuration} Days</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">Per approved request</div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Common Leave</span>
                        <div className="p-2 bg-[#F0F7FF] text-[#0B3C5D] rounded-xl shadow-inner">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D] tracking-tight mb-1">{reportData.summary.mostCommonType}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">Most frequent type</div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Rate</span>
                        <div className="p-2 bg-[#F5F3FF] text-[#7C3AED] rounded-xl shadow-inner">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-[#0B3C5D] tracking-tight mb-1">{reportData.summary.utilizationRate}%</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">Total capacity used</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Trends */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <TrendingUp size={24} className="text-[#63C132]" />
                            Monthly Trends
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest">
                            <Calendar size={14} />
                            2026
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9', radius: 4 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="leaves" fill="#0B3C5D" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leave Distribution */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col">
                    <h3 className="text-xl font-black mb-8 text-[#0B3C5D] tracking-tight flex items-center gap-3">
                        <PieChartIcon size={24} className="text-[#8b5cf6]" />
                        Leave Distribution
                    </h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData.leaveDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {reportData.leaveDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#0B3C5D', '#63C132', '#F59E0B', '#EF4444'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Employees */}
            <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-50">
                <h3 className="text-xl font-black mb-8 text-[#0B3C5D] tracking-tight flex items-center gap-3">
                    <Users size={24} className="text-[#3b82f6]" />
                    Top Employees
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportData.employeeStats.map((emp, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-50 hover:border-[#F0F7FF] hover:bg-white transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-[#0B3C5D]/10 group-hover:scale-110 transition-transform">
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0B3C5D] text-sm tracking-tight">{emp.name}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{emp.leaves} Requests</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-[#0B3C5D]">{emp.days}</div>
                                <div className="text-[10px] text-slate-300 font-black uppercase tracking-tighter">Day(s)</div>
                            </div>
                        </div>
                    ))}
                    {reportData.employeeStats.length === 0 && (
                        <div className="col-span-full py-10 text-center text-slate-400 font-medium italic">No employee leave data available yet.</div>
                    )}
                </div>

                <button
                    onClick={() => navigate('/employees')}
                    className="w-full mt-10 py-5 text-[10px] font-black text-[#0B3C5D] hover:bg-[#F0F7FF] flex items-center justify-center gap-3 border border-dashed border-slate-200 rounded-2xl transition-all uppercase tracking-[0.2em]"
                >
                    View Comprehensive List
                    <ArrowUpRight size={14} className="animate-bounce" />
                </button>
            </div>
        </div>
    );
};

export default Reports;
