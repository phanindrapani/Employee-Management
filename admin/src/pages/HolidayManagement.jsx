import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import API from '../api';
import {
    Calendar as CalendarIcon,
    MapPin,
    Tag,
    Trash2,
    AlertCircle,
    Plus
} from 'lucide-react';

const HolidayManagement = () => {
    const [holidays, setHolidays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [formData, setFormData] = useState({
        name: '',
        type: 'public',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const fetchHolidays = async () => {
        try {
            const { data } = await API.get('/holidays');
            setHolidays(data);
        } catch (err) {
            console.error('Failed to fetch holidays');
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/holidays', {
                ...formData,
                date: selectedDate
            });
            setFormData({ name: '', type: 'public', description: '' });
            fetchHolidays();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add holiday');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await API.delete(`/holidays/${id}`);
            fetchHolidays();
        } catch (err) {
            alert('Failed to delete holiday');
        }
    };

    const isHoliday = (date) => {
        return holidays.some(h => new Date(h.date).toDateString() === date.toDateString());
    };

    const getHolidayDetails = (date) => {
        return holidays.find(h => new Date(h.date).toDateString() === date.toDateString());
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <CalendarIcon size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Holidays</h1>
                    <p className="text-slate-500 font-medium">Manage company holidays</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="card">
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            tileClassName={({ date }) => {
                                const classes = [];
                                if (date.getDay() === 0) classes.push('sunday-tile');
                                if (isHoliday(date)) classes.push('holiday-tile');
                                return classes.join(' ');
                            }}
                            tileContent={({ date }) => {
                                const h = getHolidayDetails(date);
                                return h ? <div className="holiday-indicator" title={h.name} /> : null;
                            }}
                        />
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {holidays.filter(h => new Date(h.date).getFullYear() === new Date().getFullYear()).map(h => (
                            <div key={h._id} className="card p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${h.type === 'festival' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                        <Tag size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{h.name}</h4>
                                        <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteHoliday(h._id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="card sticky top-24">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-[#63C132]" />
                            Add Holiday
                        </h3>

                        <form onSubmit={handleAddHoliday} className="space-y-4">
                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="text"
                                    disabled
                                    className="input-field bg-slate-50 text-slate-500 border-none"
                                    value={selectedDate.toDateString()}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            <div>
                                <label className="label">Holiday Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Independence Day"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'public' })}
                                        className={`py-2 text-sm rounded-lg border transition-all ${formData.type === 'public'
                                            ? 'bg-primary-50 border-[#0B3C5D] text-[#0B3C5D] font-medium'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Public
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'festival' })}
                                        className={`py-2 text-sm rounded-lg border transition-all ${formData.type === 'festival'
                                            ? 'bg-amber-50 border-amber-500 text-amber-700 font-medium'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Festival
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label">Description (Optional)</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder="Details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || isHoliday(selectedDate)}
                                className="w-full py-4 bg-[#0B3C5D] text-white rounded-xl font-bold hover:bg-[#1A4B6D] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? 'Saving...' : isHoliday(selectedDate) ? 'Already Added' : 'Add Holiday'}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-primary-50 rounded-lg flex gap-3">
                            <AlertCircle size={20} className="text-[#0B3C5D] shrink-0" />
                            <p className="text-xs text-[#0B3C5D] leading-relaxed">
                                This will exclude the date from leave calculations for all employees.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayManagement;
