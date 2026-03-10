import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    Ticket as TicketIcon,
    Play,
    Pause,
    CheckCircle,
    HelpCircle,
    AlertCircle,
    Clock,
    History,
    MessageSquare,
    Send,
    X,
    Lock,
    Globe
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

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
    CRITICAL: 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold'
};

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);
    const [statusType, setStatusType] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [doubtNote, setDoubtNote] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, sRes] = await Promise.all([
                API.get('/employee/tickets'),
                API.get('/employee/tickets/stats')
            ]);
            setTickets(tRes.data);
            setStats(sRes.data);
        } catch (error) {
            showToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (statusType === 'RESOLVED' && !resolutionNote) {
            showToast('Please provide a resolution note', 'error');
            return;
        }

        try {
            await API.patch(`/employee/tickets/${selectedTicket._id}/status`, {
                status: statusType,
                resolutionNote: statusType === 'RESOLVED' ? resolutionNote : '',
                doubtNote: statusType === 'DOUBT_RAISED' ? doubtNote : ''
            });
            showToast(`Status updated to ${statusType.replace(/_/g, ' ')}`, 'success');
            setShowStatusModal(false);
            setResolutionNote('');
            setDoubtNote('');
            fetchData();
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setCommentsLoading(true);
        try {
            await API.post(`/employee/tickets/${selectedTicket._id}/comment`, {
                message: commentText,
                isInternal: isInternalComment
            });
            setCommentText('');
            // Re-fetch ticket to get latest comments
            const { data } = await API.get(`/employee/tickets/${selectedTicket._id}`);
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
            const { data } = await API.get(`/employee/tickets/${ticket._id}`);
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
                        MY<span>WORKBOARD</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Assigned Support & Service Tickets</p>
                </div>
            </div>

            {/* Employee Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-indigo-500">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Assigned</span>
                        <span className="text-3xl font-black text-[#0B3C5D]">{stats.total}</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-yellow-500">
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block mb-1">Pending Assignment</span>
                        <span className="text-3xl font-black text-[#0B3C5D]">{stats.pending}</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-blue-500">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">In Progress</span>
                        <span className="text-3xl font-black text-[#0B3C5D]">{stats.inProgress}</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-rose-500">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Doubt Raised</span>
                        <span className="text-3xl font-black text-[#0B3C5D]">{stats.doubtRaised}</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-green-500">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block mb-1">Resolved Today</span>
                        <span className="text-3xl font-black text-[#0B3C5D]">{stats.resolved}</span>
                    </div>
                </div>
            )}

            {/* Ticket Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tickets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <TicketIcon size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">No active tickets assigned to you</p>
                    </div>
                ) : tickets.map((t) => (
                    <div key={t._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 bg-slate-50 text-[#0B3C5D] rounded-xl text-[10px] font-black border border-slate-100 tracking-tighter">
                                    {t.ticketCode}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDiscussion(t);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                        title="Discussion"
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${BADGE_STLYES[t.status]}`}>
                                        {t.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-black text-[#0B3C5D] leading-tight line-clamp-2">{t.title}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t.category}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-slate-300" />
                                    <span className={`text-[10px] font-black ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AlertCircle size={12} className={t.slaBreached ? 'text-red-500' : 'text-slate-300'} />
                                    <span className={`text-[10px] font-black ${t.slaBreached ? 'text-red-500' : 'text-slate-400'}`}>
                                        {t.slaBreached ? 'SLA BREACHED' : 'ON TRACK'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed font-medium">
                                    {t.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between gap-2">
                            {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                                <>
                                    {t.status === 'ASSIGNED' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedTicket(t);
                                                setStatusType('IN_PROGRESS');
                                                setShowStatusModal(true);
                                            }}
                                            className="flex-1 bg-indigo-500 text-white rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200"
                                        >
                                            <Play size={14} /> Start Working
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="flex items-center gap-2 w-full">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(t);
                                                        setStatusType('WAITING_FOR_CLIENT');
                                                        setShowStatusModal(true);
                                                    }}
                                                    className="flex-1 bg-purple-50 text-purple-600 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-100 transition-all border border-purple-100"
                                                >
                                                    <HelpCircle size={14} /> Wait Client
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(t);
                                                        setStatusType('DOUBT_RAISED');
                                                        setShowStatusModal(true);
                                                    }}
                                                    className="flex-1 bg-rose-50 text-rose-600 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all border border-rose-100"
                                                >
                                                    <AlertCircle size={14} /> Raise Doubt
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(t);
                                                    setStatusType('RESOLVED');
                                                    setShowStatusModal(true);
                                                }}
                                                className="w-full bg-green-500 text-white rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                                            >
                                                <CheckCircle size={14} /> Resolve Ticket
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center w-full py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Task Completed
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/80 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 space-y-8 animate-in slide-in-from-bottom-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-[#0B3C5D] tracking-tight text-center">
                                {statusType === 'IN_PROGRESS' ? 'START TASK'
                                    : statusType === 'RESOLVED' ? 'COMPLETE TASK'
                                        : statusType === 'DOUBT_RAISED' ? 'RAISE DOUBT'
                                            : 'PENDING CLIENT'}
                            </h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                {selectedTicket?.ticketCode} - {selectedTicket?.title}
                            </p>
                        </div>

                        {statusType === 'RESOLVED' ? (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Resolution Summary</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm outline-none focus:ring-4 ring-green-500/10 min-h-[150px] font-bold text-slate-600"
                                    placeholder="Explain how you fixed the issue..."
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                />
                            </div>
                        ) : statusType === 'DOUBT_RAISED' ? (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Describe Your Doubt</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm outline-none focus:ring-4 ring-rose-500/10 min-h-[150px] font-bold text-slate-600"
                                    placeholder="Explain exactly what you are stuck on or need help with..."
                                    value={doubtNote}
                                    onChange={(e) => setDoubtNote(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-50 rounded-[2rem] text-center border border-slate-100">
                                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                    Are you sure you want to change the status to <span className="text-indigo-600 font-black">{statusType.replace(/_/g, ' ')}</span>?
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUpdateStatus}
                                className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${statusType === 'RESOLVED' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-[#0B3C5D] text-white shadow-[#0B3C5D]/20'
                                    }`}
                            >
                                {statusType === 'RESOLVED' ? 'CONFIRM RESOLUTION' : 'CONFIRM CHANGE'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setResolutionNote('');
                                    setDoubtNote('');
                                }}
                                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                            >
                                Nevermind
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discussion Modal */}
            {showDiscussionModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B3C5D]/80 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#0B3C5D] tracking-tight leading-none">TICKET<span>DISCUSSION</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{selectedTicket?.ticketCode} - {selectedTicket?.title}</p>
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
                            {commentsLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Updating Discussion...</p>
                                </div>
                            ) : selectedTicket?.comments?.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <MessageSquare size={48} className="opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                                </div>
                            ) : (
                                selectedTicket?.comments?.map((c, idx) => (
                                    <div key={idx} className={`flex ${c.role === 'employee' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className="flex items-center gap-2 px-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {c.userId?.name || c.role} · {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {c.isInternal && (
                                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-amber-100 uppercase">
                                                        <Lock size={8} /> Internal
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${c.role === 'employee'
                                                ? (c.isInternal ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-500 text-white shadow-indigo-100')
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
                                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
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
                                        placeholder={isInternalComment ? "Add an internal note for team leads..." : "Send a message to the client..."}
                                        className={`w-full p-6 pr-20 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:ring-4 transition-all resize-none min-h-[100px] font-bold text-slate-700 ${isInternalComment ? 'focus:ring-amber-500/10' : 'focus:ring-indigo-500/10'
                                            }`}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || commentsLoading}
                                        className={`absolute right-4 bottom-4 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90 disabled:opacity-50 disabled:scale-100 ${isInternalComment
                                            ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                                            : 'bg-indigo-500 shadow-indigo-200 hover:bg-indigo-600'
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
