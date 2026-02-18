import React, { useCallback, useEffect, useState } from 'react';
import API from '../../api';
import { LogIn, LogOut, CalendarDays } from 'lucide-react';

const Attendance = () => {
    const now = new Date();
    const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [today, setToday] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAttendance = useCallback(async () => {
        try {
            const [todayRes, listRes] = await Promise.all([
                API.get('/employee/attendance/today'),
                API.get(`/employee/attendance?month=${month}`)
            ]);
            setToday(todayRes.data);
            setRecords(listRes.data);
            setError('');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const runAction = async (endpoint) => {
        setActionLoading(true);
        try {
            const coords = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation not supported'));
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve(position.coords),
                    (geoErr) => reject(geoErr),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });

            await API.post(endpoint, {
                latitude: coords.latitude,
                longitude: coords.longitude
            });
            await fetchAttendance();
        } catch (e) {
            const message =
                e.response?.data?.message ||
                (e.code === 1 ? 'Location permission denied. Enable GPS to continue.' : null) ||
                'Action failed';
            setError(message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading attendance...</div>;

    return (
        <div className="space-y-8 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Attendance</h1>
                    <p className="text-slate-500 text-sm">Daily check-in/check-out and monthly history</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => runAction('/employee/attendance/check-in')}
                        disabled={actionLoading || !!today?.checkIn}
                        className="px-4 py-2 rounded-xl bg-[#63C132] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        <LogIn size={14} /> Check In
                    </button>
                    <button
                        onClick={() => runAction('/employee/attendance/check-out')}
                        disabled={actionLoading || !today?.checkIn || !!today?.checkOut}
                        className="px-4 py-2 rounded-xl bg-[#0B3C5D] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        <LogOut size={14} /> Check Out
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] uppercase text-slate-400 font-black">Today Status</div>
                    <div className="text-lg font-black mt-1">{today?.status || 'Absent'}</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] uppercase text-slate-400 font-black">Check In</div>
                    <div className="text-sm font-bold mt-1">{today?.checkIn ? new Date(today.checkIn).toLocaleTimeString() : '-'}</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] uppercase text-slate-400 font-black">Check Out</div>
                    <div className="text-sm font-bold mt-1">{today?.checkOut ? new Date(today.checkOut).toLocaleTimeString() : '-'}</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] uppercase text-slate-400 font-black">Working Hours</div>
                    <div className="text-sm font-bold mt-1">{today?.workingHours ?? 0}</div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2"><CalendarDays size={16} /> Monthly History</h3>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase text-slate-400">
                                <th className="py-2">Date</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Check In</th>
                                <th className="py-2">Check Out</th>
                                <th className="py-2">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.length === 0 ? (
                                <tr><td colSpan="5" className="py-6 text-center text-slate-400">No attendance records</td></tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r._id}>
                                        <td className="py-3 text-sm">{new Date(r.date).toLocaleDateString()}</td>
                                        <td className="py-3 text-sm font-semibold">{r.status}</td>
                                        <td className="py-3 text-sm">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'}</td>
                                        <td className="py-3 text-sm">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</td>
                                        <td className="py-3 text-sm">{r.workingHours ?? 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
