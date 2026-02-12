import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
    BarChart3,
    PieChart,
    Download,
    TrendingUp,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const Reports = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState({
        summary: {
            totalLeaves: 0,
            avgDuration: 0,
            mostCommonType: 'N/A',
            utilizationRate: 0
        },
        monthlyData: [],
        employeeStats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data } = await API.get('/admin/reports');
                setReportData(data);
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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Reports</h1>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white rounded-[32px] p-10 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                            <BarChart3 size={24} className="text-[#63C132]" />
                            Monthly Trends
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest">
                            <Calendar size={14} />
                            Year 2026
                        </div>
                    </div>

                    <div className="h-72 flex items-end gap-3 px-2">
                        {reportData.monthlyData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-[#E0E7FF] rounded-t-lg group-hover:bg-[#0B3C5D] transition-all duration-300 relative"
                                    style={{ height: `${val > 0 ? val * 12 : 4}px`, minHeight: '4px' }}
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B3C5D] text-white text-[10px] px-2 py-1 rounded hidden group-hover:block transition-all shadow-lg font-bold">
                                        {val}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-50">
                    <h3 className="text-xl font-black mb-8 text-[#0B3C5D] tracking-tight flex items-center gap-3">
                        <Users size={24} className="text-[#63C132]" />
                        Top Employees
                    </h3>

                    <div className="space-y-5">
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
        </div>
    );
};

export default Reports;
