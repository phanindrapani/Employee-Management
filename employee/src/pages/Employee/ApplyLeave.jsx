import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, AlertCircle, CheckCircle, FilePlus2 } from 'lucide-react';

const ApplyLeave = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        leaveType: 'CL',
        fromDate: '',
        toDate: '',
        session: 'full-day',
        reason: ''
    });
    const [attachment, setAttachment] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fetchingBalances, setFetchingBalances] = useState(false);

    const fetchLatestBalance = async () => {
        setFetchingBalances(true);
        try {
            const { data } = await API.get('/auth/profile');
            setUser(data);
        } catch (err) {
            console.error('Failed to sync balances:', err.response?.data || err.message);
        } finally {
            setFetchingBalances(false);
        }
    };

    useEffect(() => {
        fetchLatestBalance();
    }, []);

    const calculatePreview = async () => {
        if (!formData.fromDate || !formData.toDate) return;

        try {
            const { data } = await API.post('/leaves/calculate', formData);
            setPreview(data.totalDays);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Calculation failed');
            setPreview(null);
        }
    };

    useEffect(() => {
        if (formData.fromDate && formData.toDate) {
            calculatePreview();
        }
    }, [formData.fromDate, formData.toDate, formData.session]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            if (attachment) {
                formDataToSend.append('attachment', attachment);
            }

            await API.post('/leaves', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Leave application submitted successfully!');
            setFormData({
                leaveType: 'CL',
                fromDate: '',
                toDate: '',
                session: 'full-day',
                reason: ''
            });
            setAttachment(null);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Casual Leave', value: user?.leaveBalance?.cl || 0, icon: <Calendar className="text-blue-500" />, color: 'bg-blue-50' },
                    { label: 'Sick Leave', value: user?.leaveBalance?.sl || 0, icon: <AlertCircle className="text-amber-500" />, color: 'bg-amber-50' },
                    { label: 'Earned Leave', value: user?.leaveBalance?.el || 0, icon: <CheckCircle className="text-green-500" />, color: 'bg-green-50' }
                ].map((stat, idx) => (
                    <div key={idx} className={`${stat.color} p-6 rounded-[24px] border border-white shadow-sm flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-[#0B3C5D]">{stat.value} <span className="text-[10px] uppercase ml-1">Days</span></h3>
                        </div>
                        <div className="p-3 bg-white/50 rounded-xl">
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Leave Type</label>
                            <select
                                className="input-field"
                                value={formData.leaveType}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                required
                            >
                                <option value="CL">Casual Leave (CL)</option>
                                <option value="SL">Sick Leave (SL)</option>
                                <option value="EL">Earned Leave (EL)</option>
                                <option value="LOP">Loss of Pay (LOP)</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Session</label>
                            <select
                                className="input-field"
                                value={formData.session}
                                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                                required
                            >
                                <option value="full-day">Full Day</option>
                                <option value="half-morning">Half Day (Morning)</option>
                                <option value="half-afternoon">Half Day (Afternoon)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">From Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.fromDate}
                                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="label">To Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.toDate}
                                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                required
                                min={formData.fromDate || new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Reason</label>
                        <textarea
                            className="input-field min-h-[100px]"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Please provide a reason for your leave..."
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="label">Attachment (Optional)</label>
                        <input
                            type="file"
                            className="input-field cursor-pointer"
                            onChange={(e) => setAttachment(e.target.files[0])}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                            Accepted: PDF, DOC, JPG, PNG (Max 5MB)
                        </p>
                    </div>

                    {preview !== null && !error && (
                        <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-2 text-[#0B3C5D]">
                                <Clock size={18} />
                                <span className="font-medium">Total Working Days:</span>
                            </div>
                            <span className="text-xl font-bold text-[#0B3C5D]">{preview}</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100 italic text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-100">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !!error || preview === 0}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                    >
                        {loading ? 'Submitting...' : 'Apply Now'}
                    </button>
                </form>
            </div>

            <div className="card bg-[#F8FAFC] border-dashed border-2 border-slate-200">
                <h4 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Leave Policy Note</h4>
                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                    <li>Sundays are automatically excluded from leave calculation.</li>
                    <li>Public and festival holidays are not counted as leave.</li>
                    <li>Past date leaves cannot be applied through this portal.</li>
                    <li>Insufficient balance will prevent submission.</li>
                </ul>
            </div>
        </div>
    );
};

export default ApplyLeave;
