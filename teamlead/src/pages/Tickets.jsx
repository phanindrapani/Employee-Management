import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import {
    Ticket as TicketIcon,
    Search,
    UserPlus,
    Clock,
    CheckCircle,
    MoreVertical,
    ChevronRight,
    Filter,
    MessageSquare,
    Send,
    X,
    Lock,
    Globe,
    AlertCircle,
    Paperclip,
    ExternalLink,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import useSocketListener from '../hooks/useSocketListener';

const BADGE_STLYES = {
    OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
    ASSIGNED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    WAITING_FOR_CLIENT: 'bg-purple-100 text-purple-800 border-purple-200',
    DOUBT_RAISED: 'bg-rose-100 text-rose-800 border-rose-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
    REOPENED: 'bg-red-100 text-red-800 border-red-200'
};

const PRIORITY_STYLES = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-orange-500 font-semibold',
    HIGH: 'text-red-500 font-bold',
    CRITICAL: 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black underline'
};

const Tickets = () => {
    const [tickets, setTickets] = useState(() => {
        const cached = localStorage.getItem('ls_tl_tickets');
        return cached ? JSON.parse(cached) : [];
    });
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('ls_tl_ticket_stats');
        return cached ? JSON.parse(cached) : null;
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(
        !localStorage.getItem('ls_tl_tickets')
    );
    const [filter, setFilter] = useState({ status: '', priority: '' });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);
    const [assigningTo, setAssigningTo] = useState('');
    const [assignNote, setAssignNote] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const { showToast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const [tRes, sRes] = await Promise.all([
                API.get('/team-lead/tickets', { params: filter }),
                API.get('/team-lead/tickets/stats')
            ]);
            setTickets(tRes.data);
            setStats(sRes.data);
            localStorage.setItem('ls_tl_tickets', JSON.stringify(tRes.data));
            localStorage.setItem('ls_tl_ticket_stats', JSON.stringify(sRes.data));
        } catch (error) {
            showToast('Failed to fetch tickets', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, [filter.status, fetchData]);

    // Live updates via WebSocket
    useSocketListener('ticket:assigned', fetchData);
    useSocketListener('ticket:updated', fetchData);
    useSocketListener('ticket:status_changed', fetchData);
    useSocketListener('ticket:comment_added', fetchData);

    const fetchEmployees = async () => {
        try {
            const { data } = await API.get('/team-lead/team');
            setEmployees(data.members || []);
        } catch (error) {
            console.error('Failed to fetch team members');
        }
    };

    const handleAssign = async () => {
        if (!assigningTo) return;
        try {
            await API.patch(`/team-lead/tickets/${selectedTicket._id}/assign-employee`, {
                employeeId: assigningTo,
                note: assignNote
            });
            showToast('Ticket assigned to Developer', 'success');
            setShowAssignModal(false);
            setAssigningTo('');
            setAssignNote('');
            fetchData();
        } catch (error) {
            showToast('Failed to assign ticket', 'error');
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setCommentsLoading(true);
        try {
            await API.post(`/team-lead/tickets/${selectedTicket._id}/comment`, {
                message: commentText,
                isInternal: isInternalComment
            });
            setCommentText('');
            const { data } = await API.get(`/team-lead/tickets/${selectedTicket._id}`);
            setSelectedTicket(data);
            showToast('Comment added', 'success');
        } catch (error) {
            showToast('Failed to add comment', 'error');
        } finally {
            setCommentsLoading(false);
        }
    };

    const openDiscussion = async (ticket) => {
        setCommentsLoading(true);
        setSelectedTicket(ticket);
        setShowDiscussionModal(true);
        try {
            const { data } = await API.get(`/team-lead/tickets/${ticket._id}`);
            setSelectedTicket(data);
        } catch (error) {
            showToast('Failed to load discussion', 'error');
        } finally {
            setCommentsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-2">
                        <TicketIcon className="text-[#63C132]" />
                        TEAM<span>TICKETS</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Team Leader Dashboard</p>
                </div>
            </div>

            {/* TL Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Team Total" value={stats.total} colorClass="border-blue-500" titleColor="text-blue-500" />
                    <StatCard title="In Progress" value={stats.inProgress} colorClass="border-amber-500" titleColor="text-amber-500" />
                    <StatCard title="Resolved" value={stats.resolved} colorClass="border-green-500" titleColor="text-green-500" />
                    <StatCard title="Pending Me" value={stats.pendingAssignment} colorClass="border-indigo-500" titleColor="text-indigo-500" />
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#0B3C5D] tracking-widest uppercase">Active Tickets</h3>
                    <div className="flex gap-2">
                        <select
                            className="bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase px-3 py-1.5 outline-none tracking-widest shadow-sm focus:ring-2 ring-[#63C132]/10"
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">Status: All</option>
                            <option value="ASSIGNED">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-300 font-medium">No tickets found for your team</td>
                                </tr>
                            ) : tickets.map((t) => (
                                <tr key={t._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 w-auto">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-indigo-500 font-black tracking-tighter">{t.ticketCode}</span>
                                            <span className="text-sm font-black text-[#0B3C5D] truncate max-w-[250px]">{t.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className={PRIORITY_STYLES[t.priority]}>{t.priority}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{t.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-[0.1em] border ${BADGE_STLYES[t.status]}`}>
                                            {t.status.replace(/_/g, ' ')}
                                        </span>
                                        {t.status === 'DOUBT_RAISED' && t.doubtNote && (
                                            <p className="text-[9px] text-rose-500 mt-1 font-bold max-w-[150px] truncate" title={t.doubtNote}>
                                                "{t.doubtNote}"
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#0B3C5D]">
                                                {t.assignedEmployee?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[#0B3C5D] font-bold">{t.assignedEmployee?.name || 'Unassigned'}</span>
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Developer</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openDiscussion(t)}
                                            className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
                                            title="Discussion"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTicket(t);
                                                setAssigningTo(t.assignedEmployee?._id || '');
                                                setShowAssignModal(true);
                                            }}
                                            className="bg-[#0B3C5D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#63C132] transition-colors shadow-lg shadow-black/5 active:scale-95"
                                        >
                                            REASSIGN
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/70 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-md p-10 space-y-8 shadow-2xl scale-100 opacity-100 transition-all duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#63C132]/10 rounded-3xl flex items-center justify-center text-[#63C132] mx-auto mb-4">
                                <UserPlus size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight">Assign Ticket</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Assign to Developer</p>
                        </div>

                        <div className="space-y-5">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Ticket</span>
                                <span className="text-sm font-black text-[#0B3C5D]">{selectedTicket?.ticketCode} - {selectedTicket?.title}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Developer</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl text-sm px-5 py-4 outline-none focus:ring-4 ring-[#63C132]/10 font-black text-slate-600 appearance-none"
                                    value={assigningTo}
                                    onChange={(e) => setAssigningTo(e.target.value)}
                                >
                                    <option value="">Assign to Developer...</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Notes</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl text-sm px-5 py-4 outline-none focus:ring-4 ring-[#63C132]/10 min-h-[100px] font-bold text-slate-600"
                                    placeholder="Notes for the developer..."
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleAssign}
                                disabled={!assigningTo}
                                className="w-full bg-[#0B3C5D] text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl shadow-[#0B3C5D]/20 hover:bg-[#63C132] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em]"
                            >
                                Assign Ticket
                            </button>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="w-full px-6 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discussion Modal */}
            {showDiscussionModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/80 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl text-left">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight leading-none">TICKET<span>CHAT</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">
                                        {selectedTicket?.ticketCode} - {selectedTicket?.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDiscussionModal(false)}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Comments Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                            {/* Ticket Description & Attachments */}
                            {selectedTicket && (
                                <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ticket Description</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed white-space-pre-wrap">{selectedTicket.description}</p>

                                    {selectedTicket.attachments?.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Paperclip size={12} /> Attachments ({selectedTicket.attachments.length})
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedTicket.attachments.map((file, idx) => (
                                                    <a key={idx} href={file.dataUrl} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#63C132] hover:bg-white transition-all group">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-[#63C132] shadow-sm">
                                                            {file.mimeType?.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold text-slate-600 truncate">{file.fileName}</p>
                                                            <p className="text-[8px] text-slate-400 uppercase font-black">{(file.size / 1024).toFixed(0)} KB</p>
                                                        </div>
                                                        <ExternalLink size={12} className="text-slate-300 group-hover:text-[#63C132]" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {commentsLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="w-8 h-8 border-4 border-[#63C132] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading messages...</p>
                                </div>
                            ) : selectedTicket?.comments?.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <MessageSquare size={48} className="opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                                </div>
                            ) : (
                                selectedTicket?.comments?.map((c, idx) => (
                                    <div key={idx} className={`flex ${c.role === 'team-lead' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`flex items-center gap-2 px-2 ${c.role === 'team-lead' ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {c.userId?.name || c.role} · {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {c.isInternal && (
                                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-amber-100 uppercase">
                                                        <Lock size={8} /> Internal
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm text-left ${c.role === 'team-lead'
                                                ? (c.isInternal ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-[#0B3C5D] text-white shadow-indigo-100')
                                                : 'bg-white text-[#0B3C5D] border border-slate-100'
                                                }`}>
                                                {c.message}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setIsInternalComment(true)}
                                            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isInternalComment
                                                ? 'bg-amber-100 text-amber-700 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <Lock size={12} /> Internal Only
                                        </button>
                                        <button
                                            onClick={() => setIsInternalComment(false)}
                                            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isInternalComment
                                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <Globe size={12} /> Send to Client
                                        </button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={isInternalComment ? "Write a note for the team..." : "Send a message to the client..."}
                                        className={`w-full p-6 pr-20 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:ring-4 transition-all resize-none min-h-[100px] font-bold text-slate-700 text-left ${isInternalComment ? 'focus:ring-amber-500/10' : 'focus:ring-blue-500/10'
                                            }`}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || commentsLoading}
                                        className={`absolute right-4 bottom-4 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90 disabled:opacity-50 disabled:scale-100 ${isInternalComment
                                            ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                                            : 'bg-[#0B3C5D] shadow-indigo-200 hover:bg-[#1A4B6D]'
                                            }`}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for icon
const RefreshCcw = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
);

export default Tickets;
