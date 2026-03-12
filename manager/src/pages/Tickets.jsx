import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Ticket as TicketIcon,
    UserPlus,
    AlertCircle,
    BarChart3,
    Filter,
    Clock,
    MessageSquare,
    Send,
    X,
    Lock,
    Globe,
    Paperclip,
    ExternalLink,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import useSocketListener from '../hooks/useSocketListener';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';

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
    CRITICAL: 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black'
};

const Tickets = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useLocalStorage(`manager_tickets_list_${user?._id}`, []);
    const [stats, setStats] = useLocalStorage(`manager_tickets_stats_${user?._id}`, null);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(!tickets.length || !stats);
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

    const fetchData = async () => {
        try {
            const [tRes, sRes] = await Promise.all([
                API.get('/manager/tickets', { params: filter }),
                API.get('/manager/tickets/stats')
            ]);
            setTickets(tRes.data);
            setStats(sRes.data);
        } catch (error) {
            showToast('Failed to fetch tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamLeads = async () => {
        try {
            const { data } = await API.get('/manager/projects/team-leads');
            setTeamLeads(data);
        } catch (error) {
            console.error('Failed to fetch team leads');
        }
    };

    useEffect(() => {
        fetchData();
        fetchTeamLeads();
    }, [filter.status, filter.priority]);

    // WebSocket live updates
    useSocketListener('ticket:assigned', fetchData);
    useSocketListener('ticket:updated', fetchData);
    useSocketListener('ticket:status_changed', fetchData);
    useSocketListener('ticket:comment_added', fetchData);

    const handleAssign = async () => {
        if (!assigningTo) return;
        try {
            await API.patch(`/manager/tickets/${selectedTicket._id}/assign-teamlead`, {
                teamLeadId: assigningTo,
                note: assignNote
            });
            showToast('Ticket assigned to Team Lead', 'success');
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
            await API.post(`/manager/tickets/${selectedTicket._id}/comment`, {
                message: commentText,
                isInternal: isInternalComment
            });
            setCommentText('');
            const { data } = await API.get(`/manager/tickets/${selectedTicket._id}`);
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
            const { data } = await API.get(`/manager/tickets/${ticket._id}`);
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
                        <span>Tickets</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">View and manage support tickets</p>
                </div>
            </div>

            {/* Manager Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Tickets" value={stats.total} colorClass="border-blue-500" titleColor="text-blue-600" />
                    <StatCard title="Pending" value={stats.pending} colorClass="border-yellow-500" titleColor="text-yellow-600" />
                    <StatCard title="Breached" value={stats.breached} colorClass="border-red-500" titleColor="text-red-600" />
                    <StatCard title="Closed" value={stats.closed} colorClass="border-green-500" titleColor="text-green-600" />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 py-2">
                <div className="flex items-center gap-2 px-3 text-slate-400">
                    <Filter size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
                </div>
                <select
                    className="bg-white border border-slate-200 rounded-xl text-xs text-slate-600 px-4 py-2 outline-none focus:ring-2 ring-[#0B3C5D]/5 shadow-sm"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                    <option value="" className="text-slate-800">All Statuses</option>
                    <option value="ASSIGNED" className="text-slate-800">Assigned</option>
                    <option value="IN_PROGRESS" className="text-slate-800">In Progress</option>
                    <option value="WAITING_FOR_CLIENT" className="text-slate-800">Waiting for Client</option>
                    <option value="RESOLVED" className="text-slate-800">Resolved</option>
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px]">Ticket Details</th>
                                <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px]">Priority & Type</th>
                                <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px]">Current Status</th>
                                <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px]">Team Lead</th>
                                <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px]">Assign</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-medium">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400 text-sm">No tickets assigned to you</td>
                                </tr>
                            ) : tickets.map((t) => (
                                <tr key={t._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black text-[#0B3C5D]">{t.ticketCode}</span>
                                            <span className="text-slate-500 font-bold">{t.title}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t.clientId?.company || 'Client'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={PRIORITY_STYLES[t.priority]}>{t.priority}</span>
                                            <span className="text-[10px] text-slate-400 font-black">{t.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${BADGE_STLYES[t.status]}`}>
                                            {t.status.replace(/_/g, ' ')}
                                        </span>
                                        {t.status === 'DOUBT_RAISED' && t.doubtNote && (
                                            <p className="text-[9px] text-rose-500 mt-1 italic font-bold max-w-[150px] truncate" title={t.doubtNote}>
                                                "{t.doubtNote}"
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-slate-600">
                                        {t.assignedTeamLead ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-500">
                                                    {t.assignedTeamLead.name.charAt(0)}
                                                </div>
                                                {t.assignedTeamLead.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 font-bold italic tracking-tighter">Needs TL</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
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
                                                    setAssigningTo(t.assignedTeamLead?._id || '');
                                                    setShowAssignModal(true);
                                                }}
                                                className="p-2.5 text-slate-400 hover:text-[#63C132] hover:bg-[#63C132]/10 rounded-2xl transition-all active:scale-90"
                                                title="Assign Team Lead"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 space-y-8 shadow-2xl">
                        <div>
                            <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight">Assign Ticket</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 pl-1">Assign to Team Lead</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Client Request</label>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-[#0B3C5D] text-sm">
                                    {selectedTicket?.ticketCode} - {selectedTicket?.title}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Team Lead</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-2xl text-sm px-5 py-4 outline-none focus:ring-2 ring-[#63C132]/20 font-bold text-slate-600 appearance-none"
                                    value={assigningTo}
                                    onChange={(e) => setAssigningTo(e.target.value)}
                                >
                                    <option value="">Choose a Team Lead...</option>
                                    {teamLeads.map(tl => (
                                        <option key={tl._id} value={tl._id}>{tl.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Priority Instructions</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none rounded-3xl text-sm px-5 py-4 outline-none focus:ring-2 ring-[#63C132]/20 min-h-[120px] font-bold text-slate-600 placeholder:text-slate-300"
                                    placeholder="Add any specific instructions for the Team Lead..."
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!assigningTo}
                                className="flex-1 bg-[#0B3C5D] text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl shadow-[#0B3C5D]/20 hover:bg-[#1A4B6D] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest"
                            >
                                Assign TL
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Discussion Modal */}
            {showDiscussionModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/80 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight leading-none text-left">Ticket Discussion</h2>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none text-left">{selectedTicket?.ticketCode} - {selectedTicket?.title}</p>
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
                                    <div key={idx} className={`flex ${c.role === 'manager' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`flex items-center gap-2 px-2 ${c.role === 'manager' ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {c.userId?.name || c.role} · {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {c.isInternal && (
                                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-amber-100 uppercase">
                                                        <Lock size={8} /> Internal
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm text-left ${c.role === 'manager'
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
                                        placeholder={isInternalComment ? "Add an internal note for team leads & engineers..." : "Send a message to the client..."}
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
