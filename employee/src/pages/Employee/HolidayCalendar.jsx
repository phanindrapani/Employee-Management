import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import API from '../../api';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const HolidayCalendar = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const { data } = await API.get('/holidays');
                setHolidays(data);
            } catch (err) {
                console.error('Failed to fetch holidays');
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, []);

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const classes = [];
            // Check for Sundays
            if (date.getDay() === 0) classes.push('sunday-tile');

            // Check for holidays
            const dateStr = date.toISOString().split('T')[0];
            const isHoliday = holidays.some(h => {
                const hDate = new Date(h.date).toISOString().split('T')[0];
                return hDate === dateStr;
            });

            if (isHoliday) classes.push('holiday-tile');
            return classes.join(' ');
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toISOString().split('T')[0];
            const holiday = holidays.find(h => {
                const hDate = new Date(h.date).toISOString().split('T')[0];
                return hDate === dateStr;
            });

            if (holiday) {
                return <div className="holiday-indicator" title={holiday.name} />;
            }
        }
        return null;
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F0F7FF] text-[#0B3C5D] rounded-2xl shadow-inner">
                        <CalendarIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Holiday Calendar</h1>
                        <p className="text-slate-500 font-medium italic">Official company holidays for 2024-25</p>
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
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-50 p-10">
                    <Calendar
                        tileClassName={tileClassName}
                        tileContent={tileContent}
                        className="w-full border-none react-calendar-standard"
                    />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-8 h-fit">
                        <div className="flex items-center gap-2 mb-8 text-[#0B3C5D]">
                            <CalendarIcon size={20} className="text-[#63C132]" />
                            <h3 className="text-lg font-bold tracking-tight">Upcoming</h3>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading holidays...</div>
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
