import React from 'react';

const StatCard = ({ title, value, colorClass = 'border-slate-300', titleColor = 'text-slate-500', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-6 border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${titleColor}`}>{title}</p>
        <p className="text-3xl font-black text-[#0B3C5D]">{value ?? '—'}</p>
    </div>
);

export default StatCard;
