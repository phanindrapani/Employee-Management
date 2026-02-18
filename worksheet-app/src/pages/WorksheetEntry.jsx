import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { calcDuration, detectOverlaps, validateEntry, CATEGORIES, STATUSES, PRIORITIES } from '../utils/validators.js';

const STORAGE_KEY = 'ws_entries';
const DRAFT_KEY = 'ws_draft';

const emptyEntry = () => ({
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
    durationMinutes: 0,
    taskTitle: '',
    project: '',
    category: 'development',
    status: 'completed',
    priority: 'medium',
    notes: '',
    tags: ''
});

const WorksheetEntry = () => {
    const [entries, setEntries] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    });
    const [draft, setDraft] = useState(() => {
        try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || emptyEntry(); } catch { return emptyEntry(); }
    });
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);
    const [saved, setSaved] = useState(false);

    // Autosave draft
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, [draft]);

    // Persist entries
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }, [entries]);

    // Auto-calculate duration
    useEffect(() => {
        if (draft.startTime && draft.endTime) {
            const dur = calcDuration(draft.startTime, draft.endTime);
            setDraft(d => ({ ...d, durationMinutes: dur }));
        }
    }, [draft.startTime, draft.endTime]);

    const handleChange = (field, value) => {
        setDraft(d => ({ ...d, [field]: value }));
        setErrors(e => ({ ...e, [field]: undefined }));
    };

    const handleSubmit = () => {
        const errs = validateEntry(draft);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        if (editId) {
            setEntries(prev => prev.map(e => e.id === editId ? { ...draft, id: editId } : e));
            setEditId(null);
        } else {
            setEntries(prev => [...prev, { ...draft, id: crypto.randomUUID() }]);
        }
        setDraft(emptyEntry());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleEdit = (entry) => {
        setDraft({ ...entry });
        setEditId(entry.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        setEntries(prev => prev.filter(e => e.id !== id));
        if (editId === id) { setEditId(null); setDraft(emptyEntry()); }
    };

    const overlapSet = detectOverlaps(entries);

    // Day totals
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = entries.filter(e => e.date === today);
    const todayMinutes = todayEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEntries = entries.filter(e => new Date(e.date) >= weekStart);
    const weekMinutes = weekEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0);

    const fmtHours = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;

    return (
        <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0B3C5D' }}>Log Work Entry</h1>
                <p style={{ color: '#64748b', marginTop: 4 }}>Add your daily work entries. Drafts are saved automatically.</p>
            </div>

            {/* Summary Bar */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Today's Hours", value: fmtHours(todayMinutes), icon: Clock, color: '#3B82F6' },
                    { label: 'This Week', value: fmtHours(weekMinutes), icon: CheckCircle, color: '#10B981' },
                    { label: "Today's Tasks", value: todayEntries.length, icon: Plus, color: '#8B5CF6' }
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{
                        flex: 1, background: 'white', borderRadius: 12, padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entry Form */}
            <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 20 }}>
                    {editId ? '✏️ Edit Entry' : '➕ New Entry'}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <Field label="Date *" error={errors.date}>
                        <input type="date" value={draft.date} onChange={e => handleChange('date', e.target.value)} style={iStyle(errors.date)} />
                    </Field>
                    <Field label="Start Time *" error={errors.startTime}>
                        <input type="time" value={draft.startTime} onChange={e => handleChange('startTime', e.target.value)} style={iStyle(errors.startTime)} />
                    </Field>
                    <Field label="End Time *" error={errors.endTime}>
                        <input type="time" value={draft.endTime} onChange={e => handleChange('endTime', e.target.value)} style={iStyle(errors.endTime)} />
                    </Field>
                    <Field label="Duration">
                        <input type="text" value={draft.durationMinutes ? `${draft.durationMinutes} min` : '—'} readOnly style={{ ...iStyle(), background: '#f8fafc', color: '#64748b' }} />
                    </Field>
                    <Field label="Task Title *" error={errors.taskTitle} style={{ gridColumn: 'span 2' }}>
                        <input type="text" placeholder="What did you work on?" value={draft.taskTitle} onChange={e => handleChange('taskTitle', e.target.value)} style={iStyle(errors.taskTitle)} />
                    </Field>
                    <Field label="Project">
                        <input type="text" placeholder="Project name" value={draft.project} onChange={e => handleChange('project', e.target.value)} style={iStyle()} />
                    </Field>
                    <Field label="Category">
                        <select value={draft.category} onChange={e => handleChange('category', e.target.value)} style={iStyle()}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Status">
                        <select value={draft.status} onChange={e => handleChange('status', e.target.value)} style={iStyle()}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Priority">
                        <select value={draft.priority} onChange={e => handleChange('priority', e.target.value)} style={iStyle()}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </Field>
                    <Field label="Tags (comma-separated)">
                        <input type="text" placeholder="auth, backend, api" value={draft.tags} onChange={e => handleChange('tags', e.target.value)} style={iStyle()} />
                    </Field>
                    <Field label="Notes" style={{ gridColumn: 'span 2' }}>
                        <textarea rows={2} placeholder="Any additional notes..." value={draft.notes} onChange={e => handleChange('notes', e.target.value)} style={{ ...iStyle(), resize: 'vertical' }} />
                    </Field>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={handleSubmit} style={{
                        background: '#0B3C5D', color: 'white', border: 'none', borderRadius: 9,
                        padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        <Save size={16} /> {editId ? 'Update Entry' : 'Add Entry'}
                    </button>
                    {saved && <span style={{ color: '#10B981', fontWeight: 600, alignSelf: 'center', fontSize: '0.85rem' }}>✓ Saved!</span>}
                    {editId && (
                        <button onClick={() => { setEditId(null); setDraft(emptyEntry()); }} style={{
                            background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0',
                            borderRadius: 9, padding: '10px 18px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                        }}>Cancel</button>
                    )}
                </div>
            </div>

            {/* Entries Table */}
            {entries.length > 0 && (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 16 }}>
                        All Entries ({entries.length})
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Date', 'Time', 'Dur', 'Task', 'Project', 'Category', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...entries].reverse().map((e, i) => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid #f8fafc', background: overlapSet.has(entries.indexOf(e)) ? '#fff7ed' : 'transparent' }}>
                                        <td style={{ padding: '10px 12px' }}>{e.date}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', whiteSpace: 'nowrap' }}>{e.startTime}–{e.endTime}</td>
                                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{e.durationMinutes}m</td>
                                        <td style={{ padding: '10px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={e.taskTitle}>{e.taskTitle}</td>
                                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{e.project || '—'}</td>
                                        <td style={{ padding: '10px 12px' }}><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600 }}>{e.category}</span></td>
                                        <td style={{ padding: '10px 12px' }}><span style={{ background: e.status === 'completed' ? '#dcfce7' : '#fef9c3', color: e.status === 'completed' ? '#166534' : '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600 }}>{e.status}</span></td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => handleEdit(e)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Edit</button>
                                                <button onClick={() => handleDelete(e.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {overlapSet.size > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#92400e', background: '#fffbeb', padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem' }}>
                            <AlertCircle size={16} /> {overlapSet.size} entries have overlapping times (highlighted in orange)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Field = ({ label, error, children, style }) => (
    <div style={style}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
        {children}
        {error && <p style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: 3 }}>{error}</p>}
    </div>
);

const iStyle = (error) => ({
    width: '100%', padding: '9px 12px', border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
    borderRadius: 8, fontSize: '0.85rem', color: '#1e293b', outline: 'none', background: error ? '#fff5f5' : '#f8fafc'
});

export default WorksheetEntry;
