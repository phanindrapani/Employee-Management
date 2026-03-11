import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, FileText } from 'lucide-react';
import API from '../api';

const ApplyLeaveModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        leaveType: 'CL',
        fromDate: '',
        toDate: '',
        session: 'full-day',
        reason: ''
    });
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalDays, setTotalDays] = useState(0);

    const handleCalculate = async () => {
        if (!formData.fromDate || !formData.toDate) return;
        try {
            const { data } = await API.post('/manager/leaves/calculate', {
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                session: formData.session
            });
            setTotalDays(data.totalDays);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (attachment) data.append('attachment', attachment);

        try {
            await API.post('/manager/leaves', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit leave request');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-[#0B3C5D] p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Apply for Leave</h2>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Management Self-Service</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-sm font-bold animate-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Category</label>
                            <select 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all appearance-none"
                                value={formData.leaveType}
                                onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                            >
                                <option value="CL">Casual Leave</option>
                                <option value="SL">Sick Leave</option>
                                <option value="EL">Earned Leave</option>
                                <option value="LOP">Loss of Pay</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration Type</label>
                            <select 
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all appearance-none"
                                value={formData.session}
                                onChange={(e) => setFormData({...formData, session: e.target.value})}
                                onBlur={handleCalculate}
                            >
                                <option value="full-day">Full Day(s)</option>
                                <option value="half-morning">Half Day (Morning)</option>
                                <option value="half-afternoon">Half Day (Afternoon)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all"
                                value={formData.fromDate}
                                onChange={(e) => setFormData({...formData, fromDate: e.target.value})}
                                onBlur={handleCalculate}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conclusion Date</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all"
                                value={formData.toDate}
                                onChange={(e) => setFormData({...formData, toDate: e.target.value})}
                                onBlur={handleCalculate}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Absence</label>
                        <textarea 
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all min-h-[100px] resize-none"
                            placeholder="Please provide context for your request..."
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Evidence</p>
                                <p className="text-xs font-bold text-[#0B3C5D]">{attachment ? attachment.name : 'Optional'}</p>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            id="leave-attachment" 
                            className="hidden" 
                            onChange={(e) => setAttachment(e.target.files[0])}
                        />
                        <label 
                            htmlFor="leave-attachment"
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0B3C5D] hover:bg-[#0B3C5D] hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                            Upload
                        </label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Impact</span>
                            <span className="text-2xl font-black text-[#0B3C5D]">{totalDays} <span className="text-xs uppercase text-slate-300">Day(s)</span></span>
                        </div>
                        <button 
                            type="submit"
                            disabled={loading || totalDays === 0}
                            className="px-10 py-5 bg-[#63C132] text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#63C132]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? 'Processing...' : 'Submit Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
