import React, { useState } from 'react';
import { History as HistoryIcon, Calendar, Clock } from 'lucide-react';

const STORAGE_KEY = 'ws_entries';

const History = () => {
    const [entries] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    });
    const [filter, setFilter] = useState('');

    // Group by date
    const grouped = {};
    entries
        .filter(e => !filter || e.date === filter || e.taskTitle.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime))
        .forEach(e => {
            if (!grouped[e.date]) grouped[e.date] = [];
            grouped[e.date].push(e);
        });

    const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);

    return (
        <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0B3C5D' }}>Entry History</h1>
                <p style={{ color: '#64748b', marginTop: 4 }}>
                    {entries.length} total entries · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m logged
                </p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search by task or filter by date (YYYY-MM-DD)..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{
                        width: '100%', padding: '10px 16px', border: '1.5px solid #e2e8f0',
                        borderRadius: 10, fontSize: '0.9rem', outline: 'none', background: 'white'
                    }}
                />
            </div>

            {Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <HistoryIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No entries found. Start logging in the Entry page.</p>
                </div>
            ) : (
                Object.entries(grouped).map(([date, dayEntries]) => {
                    const dayMinutes = dayEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
                    return (
                        <div key={date} style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Calendar size={16} color="#0B3C5D" />
                                    <span style={{ fontWeight: 700, color: '#0B3C5D', fontSize: '0.95rem' }}>
                                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem' }}>
                                    <Clock size={14} />
                                    {Math.floor(dayMinutes / 60)}h {dayMinutes % 60}m · {dayEntries.length} tasks
                                </div>
                            </div>
                            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                                {dayEntries.map((e, i) => (
                                    <div key={e.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px',
                                        borderBottom: i < dayEntries.length - 1 ? '1px solid #f8fafc' : 'none'
                                    }}>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', minWidth: 100 }}>
                                            {e.startTime} – {e.endTime}
                                        </div>
                                        <div style={{ flex: 1, fontWeight: 500, color: '#1e293b' }}>{e.taskTitle}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{e.project || '—'}</div>
                                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600 }}>{e.category}</span>
                                        <span style={{ background: e.status === 'completed' ? '#dcfce7' : '#fef9c3', color: e.status === 'completed' ? '#166534' : '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600 }}>{e.status}</span>
                                        <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>{e.durationMinutes}m</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default History;
