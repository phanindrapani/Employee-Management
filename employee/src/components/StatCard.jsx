import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => {
    return (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 flex items-center gap-6 hover:shadow-md transition-all duration-300 group">
            <div className={`p-4 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black text-[#0B3C5D] tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
