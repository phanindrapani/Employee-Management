import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Ticket as TicketIcon,
    Filter,
    Search,
    UserPlus,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    ChevronRight,
    MessageSquare,
    Users,
    Send,
    X,
    Trash2,
    Lock,
    Globe,
    Paperclip,
    ExternalLink,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const BADGE_STYLES = {
    OPEN: 'bg-sky-50 text-sky-600 border-sky-100',
    ASSIGNED: 'bg-amber-50 text-amber-600 border-amber-100',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    WAITING_FOR_CLIENT: 'bg-purple-50 text-purple-600 border-purple-100',
    DOUBT_RAISED: 'bg-rose-50 text-rose-600 border-rose-100',
    RESOLVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    CLOSED: 'bg-slate-50 text-slate-400 border-slate-100',
    REOPENED: 'bg-red-50 text-red-600 border-red-100'
};

const PRIORITY_STYLES = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-orange-500 font-semibold',
    HIGH: 'text-red-500 font-bold',
    CRITICAL: 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black'
};

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);
    const [assigningTo, setAssigningTo] = useState('');
    const [assignNote, setAssignNote] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
        fetchManagers();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, aRes] = await Promise.all([
                API.get('/admin/tickets', { params: filter }),
                API.get('/admin/tickets/analytics')
            ]);
            setTickets(tRes.data.tickets);
            setAnalytics(aRes.data);
        } catch (error) {
            showToast('Failed to fetch tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const { data } = await API.get('/admin/employees', { params: { role: 'manager' } });
            setManagers(data);
        } catch (error) {
            console.error('Failed to fetch managers');
        }
    };

    const handleAssign = async () => {
        if (!assigningTo) return;
        try {
            await API.patch(`/admin/tickets/${selectedTicket._id}/assign-manager`, {
                managerId: assigningTo,
                note: assignNote
            });
            showToast('Ticket assigned successfully', 'success');
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
            await API.post(`/admin/tickets/${selectedTicket._id}/comment`, {
                message: commentText,
                isInternal: isInternalComment
            });
            setCommentText('');
            const { data } = await API.get(`/admin/tickets/${selectedTicket._id}`);
            // The admin get ticket might return just the ticket or an object. Based on other portals it returns the ticket.
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
            const { data } = await API.get(`/admin/tickets/${ticket._id}`);
            setSelectedTicket(data);
        } catch (error) {
            showToast('Failed to load discussion', 'error');
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleClose = async (id) => {
        if (!window.confirm('Are you sure you want to close this ticket?')) return;
        try {
            await API.patch(`/admin/tickets/${id}/close`);
            showToast('Ticket closed', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to close ticket', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-2">
                        TICKET MANAGEMENT
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Monitor and assign client support requests</p>
                </div>
            </div>

            {/* Stats */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tickets</p>
                        <p className="text-2xl font-black text-[#0B3C5D]">{analytics.summary.total}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-sky-500">
                        <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">Open</p>
                        <p className="text-2xl font-black text-[#0B3C5D]">{analytics.summary.open}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-amber-500">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Assigned</p>
                        <p className="text-2xl font-black text-[#0B3C5D]">{analytics.summary.assigned}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-emerald-500">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Resolved</p>
                        <p className="text-2xl font-black text-[#0B3C5D]">{analytics.summary.resolved}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-rose-500 col-span-2 lg:col-span-1">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">
                            SLA Breached
                        </p>
                        <p className="text-2xl font-black text-[#0B3C5D]">{analytics.summary.slaBreached}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search ticket code or title..."
                        className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-[#63C132]/20 outline-none"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    />
                </div>
                <select
                    className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2 outline-none focus:ring-2 ring-[#63C132]/20"
                    value={filter.status}
                    onChange={(e) => {
                        setFilter({ ...filter, status: e.target.value });
                        // trigger fetch on change
                    }}
                >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                </select>
                <button
                    onClick={fetchData}
                    className="bg-[#0B3C5D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1A4B6D] transition-colors"
                >
                    Apply Filter
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Ticket</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Client / Company</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Priority</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Assigned Manager</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">No tickets found</td>
                                </tr>
                            ) : tickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#0B3C5D]">{ticket.ticketCode}</span>
                                            <span className="text-slate-500 text-xs truncate max-w-[200px]">{ticket.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700">{ticket.clientId?.name}</span>
                                            <span className="text-slate-400 text-xs uppercase font-bold tracking-tighter">{ticket.clientId?.company || 'Personal'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${BADGE_STYLES[ticket.status]}`}>
                                            {ticket.status.replace(/_/g, ' ')}
                                        </span>
                                        {ticket.status === 'DOUBT_RAISED' && ticket.doubtNote && (
                                            <p className="text-[9px] text-rose-500 mt-1 italic font-bold max-w-[150px] truncate" title={ticket.doubtNote}>
                                                "{ticket.doubtNote}"
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {ticket.assignedManager ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#0B3C5D]">
                                                    {ticket.assignedManager.name.charAt(0)}
                                                </div>
                                                <span className="text-slate-600 font-medium">{ticket.assignedManager.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openDiscussion(ticket)}
                                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Discussion"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setAssigningTo(ticket.assignedManager?._id || '');
                                                    setShowAssignModal(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-[#63C132] hover:bg-[#63C132]/10 rounded-lg transition-all"
                                                title="Assign Manager"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                            {ticket.status === 'RESOLVED' && (
                                                <button
                                                    onClick={() => handleClose(ticket._id)}
                                                    className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                                                    title="Close Ticket"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/60 backdrop-blur-sm shadow-2xl transition-all duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl transform transition-all duration-300 animate-in fade-in zoom-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight">ASSIGN MANAGER</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Search size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Selected Ticket</label>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-[#0B3C5D]">
                                    {selectedTicket?.ticketCode} - {selectedTicket?.title}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Choose Manager</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-3 outline-none focus:ring-2 ring-[#63C132]/20"
                                    value={assigningTo}
                                    onChange={(e) => setAssigningTo(e.target.value)}
                                >
                                    <option value="">Select a Manager</option>
                                    {managers.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.department?.name || 'No Dept'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Note (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-3 outline-none focus:ring-2 ring-[#63C132]/20 min-h-[100px]"
                                    placeholder="Add an assignment note..."
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!assigningTo}
                                className="flex-1 bg-[#63C132] text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-[#63C132]/20 hover:bg-[#52a629] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                CONFIRM ASSIGN
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
                                    <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight leading-none italic">TICKET<span>DISCUSSION</span></h2>
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
                                    <p className="text-[10px] font-black uppercase tracking-widest">Updating Discussion...</p>
                                </div>
                            ) : selectedTicket?.comments?.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <MessageSquare size={48} className="opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                                </div>
                            ) : (
                                selectedTicket?.comments?.map((c, idx) => (
                                    <div key={idx} className={`flex ${c.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`flex items-center gap-2 px-2 ${c.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {c.userId?.name || c.role} · {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {c.isInternal && (
                                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-amber-100 uppercase">
                                                        <Lock size={8} /> Internal
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm text-left ${c.role === 'admin'
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
                                        placeholder={isInternalComment ? "Add an internal note for managers & engineers..." : "Send a message to the client..."}
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

export default Tickets;
