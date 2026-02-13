import React from 'react';
import { Award, Star, TrendingUp, Users } from 'lucide-react';

const EmployeePerformance = () => {
    // Placeholder data - in a real app, this would come from a performance review API
    const topPerformers = [
        { id: 1, name: 'John Doe', role: 'Frontend Dev', rating: 4.8, projects: 5 },
        { id: 2, name: 'Jane Smith', role: 'UI Designer', rating: 4.7, projects: 4 },
        { id: 3, name: 'Mike Johnson', role: 'Backend Dev', rating: 4.6, projects: 6 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <Award size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Employee Performance</h1>
                    <p className="text-slate-500 font-medium">Performance tracking and ratings</p>
                </div>
            </div>

            <div className="p-8 bg-white rounded-[24px] text-center border border-dashed border-slate-300">
                <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-[#0B3C5D]">Performance Module Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    We are building a comprehensive performance review system.
                    Soon you'll be able to track KPIs, set goals, and manage appraisals here.
                </p>
            </div>

            {/* Placeholder Content to make it look "different" and seeded */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Star size={20} className="text-amber-400" />
                    Top Performers (This Month)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topPerformers.map(p => (
                        <div key={p.id} className="p-4 bg-gradient-to-br from-[#F0F7FF] to-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#0B3C5D] text-white rounded-full flex items-center justify-center font-bold">
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0B3C5D]">{p.name}</div>
                                    <div className="text-xs text-slate-400 uppercase font-bold">{p.role}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Rating</span>
                                <div className="flex items-center gap-1 font-bold text-[#0B3C5D]">
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    {p.rating}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformance;
