import React, { useState } from 'react';
import API from '../api';
import { Calendar, Info } from 'lucide-react';

const ApplyLeaveForm = ({ onLeaveApplied }) => {
    const [formData, setFormData] = useState({
        leaveType: 'CL',
        fromDate: '',
        toDate: '',
        session: 'full-day'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await API.post('/leaves', formData);
            setSuccess('Leave application submitted successfully!');
            setFormData({
                leaveType: 'CL',
                fromDate: '',
                toDate: '',
                session: 'full-day'
            });
            if (onLeaveApplied) onLeaveApplied();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-6 text-primary-600">
                <Calendar size={20} />
                <h3 className="text-lg font-semibold text-slate-900">Apply for Leave</h3>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 flex items-start gap-2">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Leave Type</label>
                    <select
                        className="input-field"
                        value={formData.leaveType}
                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    >
                        <option value="CL">Casual Leave (CL)</option>
                        <option value="SL">Sick Leave (SL)</option>
                        <option value="EL">Earned Leave (EL)</option>
                        <option value="LOP">Loss of Pay (LOP)</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">From Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.fromDate}
                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                            required
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
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Session</label>
                    <select
                        className="input-field"
                        value={formData.session}
                        onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    >
                        <option value="full-day">Full Day</option>
                        <option value="half-morning">Half Day (Morning)</option>
                        <option value="half-afternoon">Half Day (Afternoon)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 mt-4"
                >
                    {loading ? 'Submitting...' : 'Apply Leave'}
                </button>
            </form>
        </div>
    );
};

export default ApplyLeaveForm;
