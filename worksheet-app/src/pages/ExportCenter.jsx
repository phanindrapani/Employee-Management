import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, FileImage, Info } from 'lucide-react';
import { exportJSON, exportCSV, exportXLSX, exportPDF, exportDOCX } from '../utils/exporters.js';

const STORAGE_KEY = 'ws_entries';

const ExportCenter = () => {
    const [entries] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    });
    const [loading, setLoading] = useState('');
    const [message, setMessage] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Filter entries based on selected dates
    const filteredEntries = entries.filter(e => {
        if (!fromDate && !toDate) return true;
        if (fromDate && e.date < fromDate) return false;
        if (toDate && e.date > toDate) return false;
        return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    const handleExport = async (format) => {
        if (filteredEntries.length === 0) {
            setMessage('No entries found for the selected date range.');
            return;
        }
        setLoading(format);
        setMessage('');
        try {
            switch (format) {
                case 'json': exportJSON(filteredEntries); break;
                case 'csv': exportCSV(filteredEntries); break;
                case 'xlsx': exportXLSX(filteredEntries); break;
                case 'pdf': await exportPDF(filteredEntries); break;
                case 'docx': await exportDOCX(filteredEntries); break;
            }
            setMessage(`✅ Exported ${filteredEntries.length} entries as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            setMessage(`❌ Export failed: ${err.message}`);
        } finally {
            setLoading('');
        }
    };

    const formats = [
        {
            id: 'csv', label: 'CSV', icon: FileSpreadsheet, color: '#10B981',
            desc: 'Best for importing into the Employee Management System. Compatible with all spreadsheet apps.',
            recommended: true
        },
        {
            id: 'xlsx', label: 'Excel (XLSX)', icon: FileSpreadsheet, color: '#3B82F6',
            desc: 'Microsoft Excel format. Great for manual review and editing before import.'
        },
        {
            id: 'json', label: 'JSON', icon: FileJson, color: '#8B5CF6',
            desc: 'Machine-readable format with full metadata. Best for developers and system integrations.'
        },
        {
            id: 'pdf', label: 'PDF', icon: FileImage, color: '#EF4444',
            desc: 'Human-readable report. Good for sharing with managers. Cannot be re-imported.'
        },
        {
            id: 'docx', label: 'Word (DOCX)', icon: FileText, color: '#F59E0B',
            desc: 'Microsoft Word format. Template-based import only — use CSV/XLSX for reliable re-import.'
        }
    ];

    const totalMinutes = filteredEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const dates = filteredEntries.map(e => e.date).sort();

    return (
        <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0B3C5D' }}>Export Center</h1>
                <p style={{ color: '#64748b', marginTop: 4 }}>Export your worksheet entries in multiple formats</p>
            </div>

            {/* Selection Bar */}
            <div style={{
                background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>From:</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>To:</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>
                <button
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
                >
                    Reset Filter
                </button>
            </div>

            {/* Summary */}
            <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div><span style={{ fontWeight: 700, color: '#0369a1' }}>{filteredEntries.length}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>entries selected</span></div>
                <div><span style={{ fontWeight: 700, color: '#0369a1' }}>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>logged in range</span></div>
                {dates.length > 0 && (
                    <div><span style={{ fontWeight: 700, color: '#0369a1' }}>{dates[0]}</span> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>to</span> <span style={{ fontWeight: 700, color: '#0369a1' }}>{dates.at(-1)}</span></div>
                )}
            </div>

            {/* Import tip */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.85rem', color: '#92400e' }}>
                <Info size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>To import into the Employee Management System: export as <strong>CSV or XLSX</strong>, then go to your Employee Panel → Worksheet Insights → drag and drop the file.</span>
            </div>

            {/* Format cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formats.map(({ id, label, icon: Icon, color, desc, recommended }) => (
                    <div key={id} style={{
                        background: 'white', borderRadius: 14, padding: '20px 24px',
                        display: 'flex', alignItems: 'center', gap: 20,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: recommended ? '2px solid #10B981' : '1px solid #f1f5f9'
                    }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            <Icon size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{label}</span>
                                {recommended && <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>RECOMMENDED FOR IMPORT</span>}
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>{desc}</p>
                        </div>
                        <button
                            onClick={() => handleExport(id)}
                            disabled={!!loading || filteredEntries.length === 0}
                            style={{
                                background: (loading === id) || filteredEntries.length === 0 ? '#f1f5f9' : color,
                                color: (loading === id) || filteredEntries.length === 0 ? '#94a3b8' : 'white',
                                border: 'none', borderRadius: 9, padding: '10px 20px',
                                fontWeight: 700, fontSize: '0.85rem', cursor: (loading || filteredEntries.length === 0) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
                                transition: 'all 0.15s', flexShrink: 0
                            }}
                        >
                            {loading === id ? (
                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            ) : <Download size={15} />}
                            Export {label}
                        </button>
                    </div>
                ))}
            </div>

            {message && (
                <div style={{
                    marginTop: 20, padding: '12px 18px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 500,
                    background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                    color: message.startsWith('✅') ? '#166534' : '#dc2626',
                    border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`
                }}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default ExportCenter;
