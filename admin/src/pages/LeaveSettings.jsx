import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Save, RefreshCw } from 'lucide-react';
import API from '../api';

const LeaveSettings = () => {
    const [settings, setSettings] = useState(() => {
        const cached = localStorage.getItem('ls_admin_leave_settings');
        return cached ? JSON.parse(cached) : { cl: 12, sl: 10, el: 15 };
    });
    const [loading, setLoading] = useState(false); // Settings aren't huge, can show old immediately
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await API.get('/admin/settings/leave');
            if (data && data.value) {
                setSettings(data.value);
                localStorage.setItem('ls_admin_leave_settings', JSON.stringify(data.value));
            }
        } catch (err) {
            setError("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await API.put('/admin/settings/leave', { value: settings });
            alert("Settings updated successfully!");
        } catch (err) {
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (type, val) => {
        setSettings(prev => ({ ...prev, [type]: parseInt(val) || 0 }));
    };

    // if (loading) return <div className="p-10 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="space-y-8 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Leave Settings</h1>
                        <p className="text-slate-500 font-medium">Configure global leave policies and quotas</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20 bg-white rounded-[32px] border border-slate-100 max-w-2xl text-slate-400 italic">
                    Loading Global Policies...
                </div>
            ) : (
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 max-w-2xl">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <Sliders size={20} className="text-[#0B3C5D]" />
                        Global Leave Quotas (per year)
                    </h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <span className="block font-bold text-slate-700">Casual Leave (CL)</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Short unplanned leaves</span>
                            </div>
                            <input
                                type="number"
                                value={settings.cl}
                                onChange={(e) => handleChange('cl', e.target.value)}
                                className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-center font-black focus:ring-2 focus:ring-[#0B3C5D] outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <span className="block font-bold text-slate-700">Sick Leave (SL)</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical related leaves</span>
                            </div>
                            <input
                                type="number"
                                value={settings.sl}
                                onChange={(e) => handleChange('sl', e.target.value)}
                                className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-center font-black focus:ring-2 focus:ring-[#0B3C5D] outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <span className="block font-bold text-slate-700">Earned Leave (EL)</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Planned privilege leaves</span>
                            </div>
                            <input
                                type="number"
                                value={settings.el}
                                onChange={(e) => handleChange('el', e.target.value)}
                                className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-center font-black focus:ring-2 focus:ring-[#0B3C5D] outline-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-500 text-xs font-bold rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                            <Sliders size={18} className="text-amber-600 shrink-0" />
                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                <strong>Important:</strong> Changing these values will update the global policy.
                                Individual overrides can still be managed via the Employee Management portal.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveSettings;

