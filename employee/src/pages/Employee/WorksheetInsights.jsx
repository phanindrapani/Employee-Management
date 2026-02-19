import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../api.js';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useSocketListener from '../../hooks/useSocketListener';
import {
    Upload, Download, FileText, BarChart3, Clock, CheckCircle2,
    TrendingUp, FolderOpen, Tag, AlertCircle, ChevronDown, Filter,
    RefreshCw, X, FileSpreadsheet, FileImage, Loader2
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 1) => (typeof n === 'number' ? n.toFixed(decimals) : '0');
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const CATEGORY_COLORS = {
    development: '#3B82F6',
    design: '#8B5CF6',
    testing: '#F59E0B',
    meeting: '#EF4444',
    documentation: '#10B981',
    research: '#06B6D4',
    support: '#F97316',
    other: '#6B7280'
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = '#3B82F6' }) => (
    <div className="ws-stat-card">
        <div className="ws-stat-icon" style={{ background: `${color}18`, color }}>
            <Icon size={22} />
        </div>
        <div>
            <div className="ws-stat-value">{value}</div>
            <div className="ws-stat-label">{label}</div>
            {sub && <div className="ws-stat-sub">{sub}</div>}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label, unit = 'h' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="ws-chart-tooltip">
                <p className="ws-tooltip-label">{label}</p>
                <p className="ws-tooltip-value">
                    {payload[0].value.toFixed(1)}{unit}
                </p>
            </div>
        );
    }
    return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const WorksheetInsights = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Upload state
    const [dragging, setDragging] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Entries state
    const [entries, setEntries] = useState([]);
    const [entriesLoading, setEntriesLoading] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // Analysis state
    const [analysis, setAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // Filters
    const [fromDate, setFromDate] = useState(daysAgo(30));
    const [toDate, setToDate] = useState(today());
    const [filterProject, setFilterProject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);

    // Export state
    const [exporting, setExporting] = useState('');

    // ── Data fetching ────────────────────────────────────────────────────────
    const fetchEntries = useCallback(async () => {
        setEntriesLoading(true);
        try {
            const params = { fromDate, toDate, page, limit: 20 };
            if (filterProject) params.project = filterProject;
            if (filterStatus) params.status = filterStatus;
            const { data } = await API.get('/employee/worksheet/entries', { params });
            setEntries(data.entries || []);
            setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
        } catch (err) {
            showToast('Failed to load entries', 'error');
        } finally {
            setEntriesLoading(false);
        }
    }, [fromDate, toDate, page, filterProject, filterStatus]);

    const fetchAnalysis = useCallback(async () => {
        setAnalysisLoading(true);
        try {
            const { data } = await API.get('/employee/worksheet/analysis', { params: { fromDate, toDate } });
            setAnalysis(data);
        } catch (err) {
            showToast('Failed to load analysis', 'error');
        } finally {
            setAnalysisLoading(false);
        }
    }, [fromDate, toDate]);

    useEffect(() => {
        fetchEntries();
        fetchAnalysis();
    }, [fetchEntries, fetchAnalysis]);

    // ── WebSocket real-time refresh ──────────────────────────────────────────
    useSocketListener('worksheet:updated', (payload) => {
        if (String(payload?.employeeId) === String(user?._id)) {
            fetchEntries();
            fetchAnalysis();
        }
    });

    // ── File upload / import ─────────────────────────────────────────────────
    const handleFile = async (file) => {
        if (!file) return;
        const allowed = ['csv', 'json', 'xlsx', 'xls', 'docx', 'pdf'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowed.includes(ext)) {
            showToast(`Unsupported file type: .${ext}. Use CSV, JSON, XLSX, DOCX, or PDF.`, 'error');
            return;
        }

        setImporting(true);
        setImportResult(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await API.post('/employee/worksheet/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(data);
            showToast(`${data.savedRows} entries imported successfully!`, 'success');
            fetchEntries();
            fetchAnalysis();
        } catch (err) {
            const msg = err.response?.data?.message || 'Import failed';
            showToast(msg, 'error');
            setImportResult(err.response?.data || null);
        } finally {
            setImporting(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    // ── Export ───────────────────────────────────────────────────────────────
    const handleExport = async (format) => {
        setExporting(format);
        try {
            const params = { format, fromDate, toDate };
            if (filterProject) params.project = filterProject;
            if (filterStatus) params.status = filterStatus;
            const response = await API.get('/employee/worksheet/export', {
                params,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `worksheet_${toDate}.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast(`Exported as ${format.toUpperCase()}`, 'success');
        } catch (err) {
            showToast(`Export failed: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setExporting('');
        }
    };

    const handleTemplateDownload = async (format) => {
        try {
            const response = await API.get('/employee/worksheet/template', {
                params: { format },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `worksheet_template.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Template download failed', 'error');
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    const maxProjectHours = analysis?.topProjects?.[0]?.hours || 1;
    const maxCatHours = analysis?.topCategories?.[0]?.hours || 1;

    return (
        <div className="ws-page">
            <style>{worksheetStyles}</style>

            {/* Header */}
            <div className="ws-header">
                <div>
                    <h1 className="ws-title">Worksheet Insights</h1>
                    <p className="ws-subtitle">Import, analyze, and export logs</p>
                </div>
                <div className="ws-header-actions flex-wrap">
                    <button className="ws-btn ws-btn-ghost flex-1 sm:flex-none justify-center" onClick={() => { fetchEntries(); fetchAnalysis(); }}>
                        <RefreshCw size={16} /> <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button className="ws-btn ws-btn-outline flex-1 sm:flex-none justify-center" onClick={() => handleTemplateDownload('csv')}>
                        <Download size={16} /> <span className="hidden sm:inline">CSV Template</span><span className="sm:hidden">CSV</span>
                    </button>
                    <button className="ws-btn ws-btn-outline flex-1 sm:flex-none justify-center" onClick={() => handleTemplateDownload('xlsx')}>
                        <Download size={16} /> <span className="hidden sm:inline">XLSX Template</span><span className="sm:hidden">XLSX</span>
                    </button>
                    <button className="ws-btn ws-btn-outline flex-1 sm:flex-none justify-center" onClick={() => handleTemplateDownload('docx')}>
                        <Download size={16} /> <span className="hidden sm:inline">DOCX Template</span><span className="sm:hidden">DOCX</span>
                    </button>
                </div>
            </div>

            {/* Date Filter Bar */}
            <div className="ws-filter-bar">
                <Filter size={16} className="ws-filter-icon" />
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="ws-input" />
                <span className="ws-filter-sep">to</span>
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="ws-input" />
                <input type="text" placeholder="Filter by project..." value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1); }} className="ws-input ws-input-wide" />
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="ws-input">
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Upload Zone */}
            <div
                className={`ws-dropzone ${dragging ? 'ws-dropzone-active' : ''} ${importing ? 'ws-dropzone-loading' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !importing && fileInputRef.current?.click()}
            >
                <input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx,.xls,.docx,.pdf" className="ws-file-input" onChange={e => handleFile(e.target.files[0])} />
                {importing ? (
                    <><Loader2 size={32} className="ws-spin" /><p>Importing file...</p></>
                ) : (
                    <>
                        <Upload size={32} className="ws-dropzone-icon" />
                        <p className="ws-dropzone-text">Drop your worksheet file here or <span className="ws-link">browse</span></p>
                        <p className="ws-dropzone-hint">Supports CSV, JSON, XLSX, DOCX, PDF</p>
                    </>
                )}
            </div>

            {/* Import Result */}
            {importResult && (
                <div className={`ws-import-result ${importResult.savedRows > 0 ? 'ws-import-success' : 'ws-import-warn'}`}>
                    <div className="ws-import-summary">
                        <span>✅ <strong>{importResult.savedRows}</strong> saved</span>
                        <span>📋 <strong>{importResult.totalRows}</strong> total rows</span>
                        {importResult.invalidRows > 0 && <span>⚠️ <strong>{importResult.invalidRows}</strong> invalid</span>}
                        {importResult.warning && <span className="ws-import-warning">⚠️ {importResult.warning}</span>}
                    </div>
                    {importResult.errors?.length > 0 && (
                        <div className="ws-error-table-wrap">
                            <table className="ws-error-table">
                                <thead><tr><th>Row</th><th>Field</th><th>Error</th></tr></thead>
                                <tbody>
                                    {importResult.errors.slice(0, 20).map((e, i) => (
                                        <tr key={i}><td>{e.row}</td><td>{e.field}</td><td>{e.message}</td></tr>
                                    ))}
                                    {importResult.errors.length > 20 && (
                                        <tr><td colSpan={3} className="ws-error-more">...and {importResult.errors.length - 20} more errors</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button className="ws-import-close" onClick={() => setImportResult(null)}><X size={16} /></button>
                </div>
            )}

            {/* Analysis Cards */}
            {analysisLoading ? (
                <div className="ws-loading"><Loader2 size={24} className="ws-spin" /> Loading analysis...</div>
            ) : analysis ? (
                <>
                    <div className="ws-stats-grid">
                        <StatCard icon={Clock} label="Total Hours" value={`${fmt(analysis.totalHours)}h`} sub={`${fromDate} → ${toDate}`} color="#3B82F6" />
                        <StatCard icon={TrendingUp} label="Productive Hours" value={`${fmt(analysis.productiveHours)}h`} sub={`${fmt(analysis.totalHours > 0 ? (analysis.productiveHours / analysis.totalHours) * 100 : 0)}% of total`} color="#10B981" />
                        <StatCard icon={CheckCircle2} label="Completion Rate" value={`${fmt(analysis.completionRatio)}%`} sub={`${analysis.tasksCompleted} tasks completed`} color="#8B5CF6" />
                        <StatCard icon={BarChart3} label="Avg Task Duration" value={`${fmt(analysis.avgTaskDuration)}m`} sub="per task" color="#F59E0B" />
                    </div>

                    {/* Charts Row */}
                    <div className="ws-charts-row">
                        {/* Trend */}
                        <div className="ws-card ws-card-wide">
                            <h3 className="ws-card-title"><TrendingUp size={16} /> Daily Trend</h3>
                            <div className="ws-chart-container">
                                {analysis.trend.length === 0 ? <div className="ws-empty">No trend data</div> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analysis.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => str.slice(5)}
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="hours"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorHours)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Top Projects */}
                        <div className="ws-card">
                            <h3 className="ws-card-title"><FolderOpen size={16} /> Top Projects</h3>
                            <div className="ws-chart-container">
                                {analysis.topProjects.length === 0 ? <p className="ws-empty">No data</p> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysis.topProjects} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={80}
                                                tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="hours" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Top Categories */}
                        <div className="ws-card">
                            <h3 className="ws-card-title"><Tag size={16} /> Categories</h3>
                            <div className="ws-chart-container">
                                {analysis.topCategories.length === 0 ? <p className="ws-empty">No data</p> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analysis.topCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="hours"
                                            >
                                                {analysis.topCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '10px', color: '#64748b' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}

            {/* Export Buttons */}
            <div className="ws-export-bar">
                <span className="ws-export-label"><Download size={15} /> Export:</span>
                {['csv', 'xlsx', 'pdf', 'docx'].map(fmt => (
                    <button key={fmt} className="ws-btn ws-btn-export" onClick={() => handleExport(fmt)} disabled={!!exporting}>
                        {exporting === fmt ? <Loader2 size={14} className="ws-spin" /> : <FileSpreadsheet size={14} />}
                        {fmt.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Entries Table */}
            <div className="ws-card ws-card-full">
                <div className="ws-table-header">
                    <h3 className="ws-card-title"><FileText size={16} /> Imported Entries ({pagination.total})</h3>
                </div>
                {entriesLoading ? (
                    <div className="ws-loading"><Loader2 size={20} className="ws-spin" /> Loading...</div>
                ) : entries.length === 0 ? (
                    <div className="ws-empty-state">
                        <FileText size={40} className="ws-empty-icon" />
                        <p>No entries found. Import a worksheet file to get started.</p>
                    </div>
                ) : (
                    <>
                        <div className="ws-table-wrap">
                            <table className="ws-table">
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Time</th><th>Duration</th><th>Task</th>
                                        <th>Project</th><th>Category</th><th>Status</th><th>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => (
                                        <tr key={e._id}>
                                            <td>{e.date}</td>
                                            <td className="ws-time">{e.startTime} – {e.endTime}</td>
                                            <td>{e.durationMinutes}m</td>
                                            <td className="ws-task-title" title={e.taskTitle}>{e.taskTitle}</td>
                                            <td>{e.project || '—'}</td>
                                            <td>
                                                <span className="ws-badge" style={{ background: `${CATEGORY_COLORS[e.category] || '#6B7280'}22`, color: CATEGORY_COLORS[e.category] || '#6B7280' }}>
                                                    {e.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ws-badge ws-status-${e.status}`}>{e.status}</span>
                                            </td>
                                            <td>
                                                <span className={`ws-badge ws-priority-${e.priority}`}>{e.priority}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="ws-pagination">
                                <button className="ws-btn ws-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <span>Page {page} of {pagination.pages}</span>
                                <button className="ws-btn ws-btn-ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const worksheetStyles = `
.ws-page { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.ws-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.ws-title { font-size: 1.75rem; font-weight: 800; color: #0B3C5D; margin: 0; }
.ws-subtitle { color: #64748b; margin: 4px 0 0; font-size: 0.9rem; }
.ws-header-actions { display: flex; gap: 10px; }

.ws-filter-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: white; padding: 14px 18px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.ws-filter-icon { color: #64748b; }
.ws-filter-sep { color: #94a3b8; font-size: 0.85rem; }
.ws-input { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 0.85rem; color: #334155; background: #f8fafc; outline: none; transition: border 0.2s; }
.ws-input:focus { border-color: #3B82F6; background: white; }
.ws-input-wide { min-width: 160px; }

.ws-dropzone { border: 2.5px dashed #cbd5e1; border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.ws-dropzone:hover, .ws-dropzone-active { border-color: #3B82F6; background: #eff6ff; }
.ws-dropzone-loading { opacity: 0.7; cursor: not-allowed; }
.ws-dropzone-icon { color: #94a3b8; }
.ws-dropzone-text { color: #475569; font-size: 1rem; margin: 0; }
.ws-dropzone-hint { color: #94a3b8; font-size: 0.8rem; margin: 0; }
.ws-link { color: #3B82F6; font-weight: 600; }
.ws-file-input { display: none; }

.ws-import-result { border-radius: 12px; padding: 16px 20px; position: relative; }
.ws-import-success { background: #f0fdf4; border: 1.5px solid #86efac; }
.ws-import-warn { background: #fffbeb; border: 1.5px solid #fcd34d; }
.ws-import-summary { display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.9rem; color: #374151; margin-bottom: 10px; }
.ws-import-warning { color: #92400e; font-style: italic; }
.ws-import-close { position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; color: #94a3b8; }
.ws-error-table-wrap { overflow-x: auto; max-height: 200px; overflow-y: auto; }
.ws-error-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.ws-error-table th { background: #fef3c7; padding: 6px 10px; text-align: left; color: #92400e; }
.ws-error-table td { padding: 5px 10px; border-bottom: 1px solid #fde68a; color: #374151; }
.ws-error-more { text-align: center; color: #92400e; font-style: italic; }

.ws-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.ws-stat-card { background: white; border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
.ws-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ws-stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1; }
.ws-stat-label { font-size: 0.8rem; color: #64748b; margin-top: 4px; font-weight: 500; }
.ws-stat-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

.ws-charts-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; }
@media (max-width: 1100px) { .ws-charts-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .ws-charts-row { grid-template-columns: 1fr; } }

.ws-card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; display: flex; flex-direction: column; }
.ws-card-title { font-size: 0.9rem; font-weight: 700; color: #334155; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }

.ws-chart-container { flex: 1; min-height: 200px; width: 100%; position: relative; }

.ws-chart-tooltip { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.ws-tooltip-label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin: 0 0 4px; }
.ws-tooltip-value { font-size: 0.9rem; font-weight: 800; color: #0B3C5D; margin: 0; }

.ws-export-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ws-export-label { font-size: 0.85rem; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px; }

.ws-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.ws-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ws-btn-ghost { background: transparent; color: #475569; border: 1.5px solid #e2e8f0; }
.ws-btn-ghost:hover:not(:disabled) { background: #f8fafc; }
.ws-btn-outline { background: white; color: #0B3C5D; border: 1.5px solid #0B3C5D; }
.ws-btn-outline:hover:not(:disabled) { background: #0B3C5D; color: white; }
.ws-btn-export { background: #f8fafc; color: #334155; border: 1.5px solid #e2e8f0; font-size: 0.8rem; padding: 7px 14px; }
.ws-btn-export:hover:not(:disabled) { background: #0B3C5D; color: white; border-color: #0B3C5D; }

.ws-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; }
.ws-table-wrap { overflow-x: auto; }
.ws-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.ws-table th { padding: 10px 14px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; background: #f8fafc; }
.ws-table td { padding: 11px 14px; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
.ws-table tr:hover td { background: #f8fafc; }
.ws-time { font-family: monospace; font-size: 0.8rem; color: #64748b; white-space: nowrap; }
.ws-task-title { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }

.ws-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; }
.ws-status-completed { background: #dcfce7; color: #166534; }
.ws-status-in-progress { background: #dbeafe; color: #1e40af; }
.ws-status-blocked { background: #fee2e2; color: #991b1b; }
.ws-status-pending { background: #fef9c3; color: #854d0e; }
.ws-priority-critical { background: #fee2e2; color: #991b1b; }
.ws-priority-high { background: #ffedd5; color: #9a3412; }
.ws-priority-medium { background: #fef9c3; color: #854d0e; }
.ws-priority-low { background: #f0fdf4; color: #166534; }

.ws-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 0 4px; font-size: 0.85rem; color: #64748b; }
.ws-loading { display: flex; align-items: center; gap: 10px; color: #64748b; padding: 20px; font-size: 0.9rem; }
.ws-empty { color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 20px 0; }
.ws-empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 50px 20px; color: #94a3b8; }
.ws-empty-icon { opacity: 0.4; }
.ws-spin { animation: ws-spin 1s linear infinite; }
@keyframes ws-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default WorksheetInsights;