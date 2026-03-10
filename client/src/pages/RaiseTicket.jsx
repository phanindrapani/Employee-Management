import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { ChevronLeft, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['BUG', 'FEATURE', 'SUPPORT', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const RaiseTicket = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', description: '', category: 'SUPPORT', priority: 'MEDIUM', projectId: ''
    });
    const [projects, setProjects] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await API.get('/client/tickets/projects');
                setProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects');
            }
        };
        fetchProjects();
    }, []);

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (attachments.length + files.length > 5) {
            setError('Maximum 5 attachments allowed');
            return;
        }
        setAttachments([...attachments, ...files]);
        setError('');
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('priority', form.priority);
        if (form.projectId) formData.append('projectId', form.projectId);

        attachments.forEach(file => {
            formData.append('attachments', file);
        });

        try {
            const { data } = await API.post('/client/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/tickets/${data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="layout">
            <header className="topbar">
                <div className="topbar-brand">SupportDesk</div>
                <Link to="/dashboard" className="btn-logout">
                    <ChevronLeft size={14} /> Back to Dashboard
                </Link>
            </header>
            <main className="page-content">
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Raise a Support Ticket</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '.875rem', marginTop: '.25rem' }}>
                        Describe your issue clearly to help us resolve it faster.
                    </p>
                </div>

                <div className="form-card">
                    {error && <div className="error-msg">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Ticket Title *</label>
                            <input type="text" placeholder="Short issue title (e.g. Login button not working)" required
                                value={form.title} onChange={set('title')} />
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <textarea placeholder="Describe the issue in detail. Include steps to reproduce, expected vs actual behavior, etc."
                                required value={form.description} onChange={set('description')} rows={5} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={set('category')}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={form.priority} onChange={set('priority')}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Relate to Project (optional)</label>
                            <select value={form.projectId} onChange={set('projectId')}>
                                <option value="">Select a Project</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} ({p.status})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Attachments (Max 5)</label>
                            <div className="file-upload-wrapper">
                                <input type="file" multiple onChange={handleFileChange} accept="image/*,.pdf,.docx" />
                                <div className="file-upload-info">
                                    <Upload className="icon" size={24} />
                                    <span style={{ fontWeight: 600 }}>Click or drag files to upload</span>
                                    <span style={{ fontSize: '0.75rem' }}>Images, PDF, or DOCX (Max 5MB each)</span>
                                </div>
                            </div>

                            {attachments.length > 0 && (
                                <div className="attachment-list">
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="attachment-preview">
                                            {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                                            <span className="file-name">{file.name}</span>
                                            <button type="button" className="remove-btn" onClick={() => removeAttachment(idx)}>
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default RaiseTicket;
