import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => {
    return (
        <div className="card flex items-center gap-5">
            <div className={`p-4 rounded-xl ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
