import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPlaceholder = ({ title }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                    <p className="text-slate-500 font-medium">Manage your {title.toLowerCase()}</p>
                </div>
            </div>

            <div className="p-12 text-center bg-white rounded-[24px] border border-dashed border-slate-300">
                <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-[#0B3C5D]">{title} Module</h3>
                <p className="text-slate-500 mt-2">This feature is currently under development.</p>
            </div>
        </div>
    );
};

export default SettingsPlaceholder;
