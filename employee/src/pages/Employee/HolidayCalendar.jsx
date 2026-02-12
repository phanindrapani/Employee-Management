import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import API from '../../api';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const HolidayCalendar = () => {
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [holidaysRes, leavesRes] = await Promise.allSettled([
                    API.get('/holidays'),
                    API.get('/leaves')
                ]);

                if (holidaysRes.status === 'fulfilled') setHolidays(holidaysRes.value.data);
                if (leavesRes.status === 'fulfilled') setLeaves(leavesRes.value.data);

            } catch (err) {
                console.error('Failed to fetch calendar data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getLocalDateString = (date) => {
        const d = new Date(date);
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60000));
        return localDate.toISOString().split('T')[0];
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const classes = [];

            // Check for Sundays
            if (date.getDay() === 0) classes.push('sunday-tile');

            const dateStr = getLocalDateString(date);

            // Check for holidays
            const isHoliday = holidays.some(h => {
                const hDate = getLocalDateString(h.date);
                return hDate === dateStr;
            });
            if (isHoliday) classes.push('holiday-tile');

            // Check for approved leaves
            const isLeave = leaves.some(l => {
                if (l.status !== 'approved') return false;
                // Parse leave dates as basic dates to avoid timezone shifts
                const from = new Date(l.fromDate).toISOString().split('T')[0];
                const to = new Date(l.toDate).toISOString().split('T')[0];

                return dateStr >= from && dateStr <= to;
            });
            if (isLeave && !isHoliday && date.getDay() !== 0) classes.push('leave-tile');

            return classes.join(' ');
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = getLocalDateString(date);

            const holiday = holidays.find(h => {
                const hDate = getLocalDateString(h.date);
                return hDate === dateStr;
            });

            if (holiday) {
                return <div className="holiday-indicator" title={holiday.name} />;
            }

            // Check for approved leaves indicator
            const isLeave = leaves.some(l => {
                if (l.status !== 'approved') return false;
                const from = new Date(l.fromDate).toISOString().split('T')[0];
                const to = new Date(l.toDate).toISOString().split('T')[0];

                return dateStr >= from && dateStr <= to;
            });

            if (isLeave && !holiday && date.getDay() !== 0) {
                return <div className="leave-indicator" title="Your Leave" />;
            }
        }
        return null;
    };

    const [selectedEvent, setSelectedEvent] = useState(null);

    const onDateClick = (date) => {
        const dateStr = getLocalDateString(date);

        // Check Holiday
        const holiday = holidays.find(h => {
            const hDate = getLocalDateString(h.date);
            return hDate === dateStr;
        });

        if (holiday) {
            setSelectedEvent({ type: 'holiday', data: holiday });
            return;
        }

        // Check Leave
        const leave = leaves.find(l => {
            if (l.status !== 'approved') return false;
            const from = new Date(l.fromDate).toISOString().split('T')[0];
            const to = new Date(l.toDate).toISOString().split('T')[0];
            return dateStr >= from && dateStr <= to;
        });

        if (leave) {
            setSelectedEvent({ type: 'leave', data: leave });
            return;
        }

        setSelectedEvent(null);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D] relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                        <CalendarIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Schedule & Holidays</h1>
                        <p className="text-slate-500 font-medium italic">Your leaves and company holidays</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-50 border border-red-100 rounded-lg"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-50 border border-amber-100 rounded-lg"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#F0FFF4] border border-[#16A34A] rounded-lg"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Leave</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-50 p-10 relative">
                    <Calendar
                        tileClassName={tileClassName}
                        tileContent={tileContent}
                        onClickDay={onDateClick}
                        className="w-full border-none react-calendar-standard"
                    />

                    {/* Details Modal / Popover */}
                    {selectedEvent && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black text-[#0B3C5D]">
                                    {selectedEvent.type === 'holiday' ? 'Holiday Details' : 'Leave Details'}
                                </h3>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="text-slate-400 hover:text-slate-600 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {selectedEvent.type === 'holiday' ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Occasion</p>
                                        <p className="font-bold text-[#0B3C5D]">{selectedEvent.data.name}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Type</span>
                                        <span className="font-bold text-[#0B3C5D] capitalize">{selectedEvent.data.type}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-[#F0FFF4] rounded-xl border border-[#16A34A]/20">
                                        <p className="text-xs font-bold text-[#166534] uppercase tracking-wider mb-1">Pass Type</p>
                                        <p className="font-bold text-[#0B3C5D]">{selectedEvent.data.leaveType}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Duration</span>
                                            <span className="font-bold text-[#0B3C5D]">{selectedEvent.data.totalDays} Days</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Session</span>
                                            <span className="font-bold text-[#0B3C5D] capitalize">{selectedEvent.data.session}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-50">
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reason</p>
                                            <p className="text-sm text-slate-600 leading-snug">{selectedEvent.data.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {selectedEvent && (
                        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedEvent(null)} />
                    )}
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8 h-fit">
                        <div className="flex items-center gap-2 mb-8 text-[#0B3C5D]">
                            <CalendarIcon size={20} className="text-[#63C132]" />
                            <h3 className="text-lg font-bold tracking-tight">Upcoming Holidays</h3>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</div>
                            ) : holidays.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No holidays scheduled</div>
                            ) : (
                                holidays
                                    .filter(h => new Date(h.date) >= new Date())
                                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                                    .slice(0, 5)
                                    .map(h => (
                                        <div key={h._id} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-[#63C132]/20 hover:bg-white transition-all duration-300 group">
                                            <div>
                                                <div className="font-bold text-[#0B3C5D] text-sm tracking-tight group-hover:text-[#63C132] transition-colors">{h.name}</div>
                                                <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">{h.type}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-[#63C132]">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0B3C5D] rounded-[32px] p-8 text-white shadow-xl shadow-[#0B3C5D]/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#63C132]/10 transition-colors"></div>
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Info size={24} className="text-[#63C132]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-2">Leave Policy</h4>
                                <p className="text-sm text-blue-100/80 leading-relaxed font-medium">
                                    Holidays and Sundays are automatically excluded from your leave calculations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayCalendar;
