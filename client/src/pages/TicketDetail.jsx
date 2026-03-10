import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { ChevronLeft, Send, RefreshCw, CheckCircle, AlertTriangle, Paperclip, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

const BADGE = {
    OPEN: 'badge badge-open', ASSIGNED: 'badge badge-assigned', IN_PROGRESS: 'badge badge-progress',
    WAITING_FOR_CLIENT: 'badge badge-waiting', DOUBT_RAISED: 'badge badge-doubt', RESOLVED: 'badge badge-resolved', CLOSED: 'badge badge-closed', REOPENED: 'badge badge-reopened'
};
const P_CLASS = { LOW: 'p-low', MEDIUM: 'p-medium', HIGH: 'p-high', CRITICAL: 'p-critical' };

const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

const TicketDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [showReopen, setShowReopen] = useState(false);
    const bottomRef = useRef(null);

    const fetchTicket = async () => {
        try {
            const { data } = await API.get(`/client/tickets/${id}`);
            setTicket(data);
        } catch {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTicket(); }, [id]);

    const sendComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSending(true);
        try {
            await API.post(`/client/tickets/${id}/comment`, { message: comment });
            setComment('');
            await fetchTicket();
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        } finally {
            setSending(false);
        }
    };

    const reopen = async () => {
        try {
            await API.patch(`/client/tickets/${id}/reopen`, { reason: reopenReason });
            setShowReopen(false);
            setReopenReason('');
            await fetchTicket();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reopen ticket');
        }
    };

    if (loading) return <div className="loader">Loading ticket...</div>;
    if (!ticket) return null;

    const canReopen = ['RESOLVED', 'CLOSED'].includes(ticket.status);

    return (
        <div className="layout">
            <header className="topbar">
                <div className="topbar-brand">SupportDesk</div>
                <Link to="/dashboard" className="btn-logout"><ChevronLeft size={14} /> Dashboard</Link>
            </header>
            <main className="page-content">
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{ticket.ticketCode}</p>
                        <span className={BADGE[ticket.status]}>{ticket.status.replace(/_/g, ' ')}</span>
                        <span className={P_CLASS[ticket.priority]} style={{ fontSize: '.85rem', fontWeight: 600 }}>{ticket.priority}</span>
                    </div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '.5rem' }}>{ticket.title}</h1>
                </div>

                <div className="detail-grid">
                    {/* LEFT PANEL */}
                    <div>
                        {/* Description */}
                        <div className="detail-card" style={{ marginBottom: '1rem' }}>
                            <h3>Description</h3>
                            <p style={{ fontSize: '.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>

                            {ticket.attachments?.length > 0 && (
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <Paperclip size={14} /> Attachments ({ticket.attachments.length})
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
                                        {ticket.attachments.map((file, idx) => (
                                            <a key={idx} href={file.dataUrl} target="_blank" rel="noopener noreferrer"
                                                className="attachment-preview" style={{ textDecoration: 'none', color: 'inherit', border: '1.5px solid var(--border)', background: 'var(--surface2)' }}>
                                                {file.mimeType?.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                <span className="file-name" style={{ fontSize: '.8rem' }}>{file.fileName}</span>
                                                <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="detail-card">
                            <h3>Discussion</h3>
                            <div className="comment-list">
                                {ticket.comments.length === 0 && (
                                    <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>No comments yet. Start the conversation!</p>
                                )}
                                {ticket.comments.map(c => (
                                    <div key={c._id} className={`comment ${c.role === 'client' ? 'client-comment' : ''}`}>
                                        <div className="comment-author">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                                                <span style={{
                                                    background: c.role === 'client' ? 'var(--brand)' : '#e2e8f0',
                                                    color: c.role === 'client' ? '#fff' : 'var(--text)', borderRadius: '50%',
                                                    width: 22, height: 22, display: 'inline-flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '.65rem', fontWeight: 700
                                                }}>
                                                    {initials(c.userId?.name || c.role)}
                                                </span>
                                                {c.userId?.name || c.role.toUpperCase()} · {c.role.toUpperCase()}
                                            </span>
                                            <span>{formatDate(c.createdAt)}</span>
                                        </div>
                                        <div className="comment-text">{c.message}</div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {ticket.status !== 'CLOSED' && (
                                <form onSubmit={sendComment} style={{ marginTop: '.75rem' }}>
                                    <textarea className="comment-input" placeholder="Write a reply..." value={comment}
                                        onChange={e => setComment(e.target.value)} rows={3} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                                        <button type="submit" className="btn-submit" disabled={sending || !comment.trim()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                            <Send size={14} /> {sending ? 'Sending...' : 'Send Reply'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Reopen */}
                            {canReopen && !showReopen && (
                                <button onClick={() => setShowReopen(true)} className="btn-secondary"
                                    style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                                    <RefreshCw size={14} /> Reopen Ticket
                                </button>
                            )}
                            {showReopen && (
                                <div style={{ marginTop: '1rem', background: 'var(--surface2)', borderRadius: 10, padding: '1rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.5rem' }}>Reason for reopening</p>
                                    <textarea className="comment-input" rows={3} placeholder="Explain why the issue is not resolved..."
                                        value={reopenReason} onChange={e => setReopenReason(e.target.value)} />
                                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                                        <button className="btn-secondary" onClick={() => setShowReopen(false)}>Cancel</button>
                                        <button className="btn-submit" onClick={reopen} disabled={!reopenReason.trim()}>Confirm Reopen</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div>
                        <div className="detail-card" style={{ marginBottom: '1rem' }}>
                            <h3>Ticket Info</h3>
                            <div className="meta-list">
                                <div className="meta-item"><span className="key">Category</span><span className="val">{ticket.category}</span></div>
                                <div className="meta-item"><span className="key">Priority</span><span className={`val ${P_CLASS[ticket.priority]}`}>{ticket.priority}</span></div>
                                <div className="meta-item"><span className="key">Status</span>
                                    <span className={BADGE[ticket.status]}>{ticket.status.replace(/_/g, ' ')}</span></div>
                                <div className="meta-item"><span className="key">SLA Due</span>
                                    <span className="val" style={{ color: ticket.slaBreached ? 'var(--danger)' : 'inherit' }}>
                                        {formatDate(ticket.dueDate)} {ticket.slaBreached && '⚠️ Breached'}
                                    </span>
                                </div>
                                <div className="meta-item"><span className="key">Opened</span><span className="val">{formatDate(ticket.createdAt)}</span></div>
                                {ticket.resolvedAt && <div className="meta-item"><span className="key">Resolved</span><span className="val">{formatDate(ticket.resolvedAt)}</span></div>}
                            </div>
                        </div>

                        {ticket.resolutionNote && (
                            <div className="detail-card" style={{ marginBottom: '1rem', border: '1.5px solid #dcfce7' }}>
                                <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <CheckCircle size={16} /> Resolution Note
                                </h3>
                                <p style={{ fontSize: '.875rem', lineHeight: 1.7 }}>{ticket.resolutionNote}</p>
                            </div>
                        )}

                        {ticket.status === 'DOUBT_RAISED' && ticket.doubtNote && (
                            <div className="detail-card" style={{ marginBottom: '1rem', border: '1.5px solid #ffe4e6' }}>
                                <h3 style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <AlertTriangle size={16} /> Internal Review Note
                                </h3>
                                <p style={{ fontSize: '.875rem', lineHeight: 1.7 }}>{ticket.doubtNote}</p>
                                <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.5rem italic' }}>
                                    The engineer has raised a technical query and is performing an internal review.
                                </p>
                            </div>
                        )}

                        <div className="detail-card">
                            <h3>Assignment</h3>
                            <div className="meta-list">
                                <div className="meta-item"><span className="key">Manager</span>
                                    <span className="val">{ticket.assignedManager?.name || '—'}</span></div>
                                <div className="meta-item"><span className="key">Team Lead</span>
                                    <span className="val">{ticket.assignedTeamLead?.name || '—'}</span></div>
                                <div className="meta-item"><span className="key">Engineer</span>
                                    <span className="val">{ticket.assignedEmployee?.name || '—'}</span></div>
                            </div>
                        </div>

                        {ticket.assignmentHistory?.length > 0 && (
                            <div className="detail-card" style={{ marginTop: '1rem' }}>
                                <h3>Timeline</h3>
                                <div className="timeline">
                                    {ticket.assignmentHistory.map(h => (
                                        <div key={h._id} className="tl-item">
                                            <div className="tl-dot" />
                                            <div className="tl-content">
                                                Assigned to <strong>{h.assignedTo?.name || h.role}</strong>
                                                <br />{formatDate(h.assignedAt)}
                                                {h.note && <><br /><em>{h.note}</em></>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TicketDetail;
