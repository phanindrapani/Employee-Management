import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { Ticket, Plus, LogOut, AlertTriangle } from 'lucide-react';

const BADGE = {
    OPEN: 'badge badge-open', ASSIGNED: 'badge badge-assigned', IN_PROGRESS: 'badge badge-progress',
    WAITING_FOR_CLIENT: 'badge badge-waiting', DOUBT_RAISED: 'badge badge-doubt', RESOLVED: 'badge badge-resolved',
    CLOSED: 'badge badge-closed', REOPENED: 'badge badge-reopened'
};
const P_CLASS = { LOW: 'p-low', MEDIUM: 'p-medium', HIGH: 'p-high', CRITICAL: 'p-critical' };

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, sRes] = await Promise.all([
                    API.get('/client/tickets'),
                    API.get('/client/tickets/stats')
                ]);
                setTickets(tRes.data);
                setStats(sRes.data);
            } catch {
                // silently handle
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const displayed = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="layout">
            <header className="topbar">
                <div className="topbar-brand"><Ticket size={20} /> SupportDesk</div>
                <div className="topbar-user">
                    <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: '.875rem', fontWeight: 500 }}>{user?.name}</span>
                    <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            <main className="page-content">
                <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Support Tickets</h1>
                        <p style={{ color: 'var(--muted)', fontSize: '.875rem', marginTop: '.25rem' }}>
                            Welcome back, {user?.name} {user?.company && `· ${user.company}`}
                        </p>
                    </div>
                    <Link to="/tickets/new" className="btn-new"><Plus size={16} /> Raise Ticket</Link>
                </div>

                {!loading && stats && (
                    <div className="stats-grid">
                        <div className="stat-card"><span className="label">Total</span><span className="value">{stats.total}</span></div>
                        <div className="stat-card open"><span className="label">Open</span><span className="value">{stats.open}</span></div>
                        <div className="stat-card progress"><span className="label">In Progress</span><span className="value">{stats.inProgress}</span></div>
                        <div className="stat-card resolved"><span className="label">Resolved</span><span className="value">{stats.resolved}</span></div>
                        <div className="stat-card closed"><span className="label">Closed</span><span className="value">{stats.closed}</span></div>
                        {stats.slaBreached > 0 && (
                            <div className="stat-card sla">
                                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                                    <AlertTriangle size={12} /> SLA Breached
                                </span>
                                <span className="value">{stats.slaBreached}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'DOUBT_RAISED', 'RESOLVED', 'CLOSED'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{
                                padding: '.35rem .85rem', borderRadius: '99px', border: '1.5px solid',
                                borderColor: filter === s ? 'var(--brand)' : 'var(--border)',
                                background: filter === s ? 'var(--brand)' : 'transparent',
                                color: filter === s ? '#fff' : 'var(--muted)',
                                fontSize: '.78rem', fontWeight: 600, cursor: 'pointer'
                            }}>
                            {s.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div className="ticket-table">
                    {loading ? (
                        <div className="empty">Loading tickets...</div>
                    ) : displayed.length === 0 ? (
                        <div className="empty">
                            <p>No tickets found.</p>
                            <p style={{ marginTop: '.5rem' }}><Link to="/tickets/new" style={{ color: 'var(--brand)' }}>Raise your first ticket →</Link></p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map(t => (
                                    <tr key={t._id} onClick={() => navigate(`/tickets/${t._id}`)}>
                                        <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{t.ticketCode}</td>
                                        <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                                        <td>{t.category}</td>
                                        <td><span className={P_CLASS[t.priority]}>{t.priority}</span></td>
                                        <td><span className={BADGE[t.status]}>{t.status.replace(/_/g, ' ')}</span></td>
                                        <td>{formatDate(t.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
