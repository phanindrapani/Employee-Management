import React from 'react';

const StatCard = ({ title, value, colorClass, titleColor = "text-slate-400" }) => {
    return (
        <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 border-l-4 ${colorClass} flex flex-col justify-between hover:shadow-md transition-all duration-300 group`}>
            <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${titleColor} mb-1 transition-colors`}>{title}</p>
                <h3 className="text-3xl font-black text-[#0B3C5D] tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
