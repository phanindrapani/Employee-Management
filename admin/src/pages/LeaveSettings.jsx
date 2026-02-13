import React from 'react';
import { Settings, Sliders } from 'lucide-react';

const LeaveSettings = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Leave Settings</h1>
                    <p className="text-slate-500 font-medium">Configure leave policies and quotas</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Sliders size={20} className="text-[#0B3C5D]" />
                    Default Quotas
                </h3>

                <div className="space-y-6 max-w-lg">
                    <div className="grid grid-cols-2 items-center gap-4">
                        <label className="font-semibold text-slate-700">Casual Leave (CL)</label>
                        <input type="number" value="12" disabled className="input-field bg-slate-50" />
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <label className="font-semibold text-slate-700">Sick Leave (SL)</label>
                        <input type="number" value="10" disabled className="input-field bg-slate-50" />
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <label className="font-semibold text-slate-700">Earned Leave (EL)</label>
                        <input type="number" value="15" disabled className="input-field bg-slate-50" />
                    </div>

                    <div className="text-xs text-slate-400 italic">
                        * Global settings update is currently disabled. You can override these per employee in the Employee Edit screen.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveSettings;
