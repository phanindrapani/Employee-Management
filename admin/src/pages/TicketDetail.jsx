import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Lock,
    Globe,
    Paperclip,
    ExternalLink,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const { data } = await API.get(`/admin/tickets/${id}`);
            setTicket(data);
        } catch (error) {
            showToast('Failed to fetch ticket details', 'error');
            navigate('/tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setCommentsLoading(true);
        try {
            await API.post(`/admin/tickets/${id}/comment`, {
                message: commentText,
                isInternal: isInternalComment
            });
            setCommentText('');
            showToast('Comment added', 'success');
            fetchTicket(); // Refresh ticket to get new comments
        } catch (error) {
            showToast('Failed to add comment', 'error');
        } finally {
            setCommentsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-4 border-[#63C132] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Ticket Details...</p>
                </div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <button
                    onClick={() => navigate('/tickets')}
                    className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-[#0B3C5D] transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-[#0B3C5D] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#0B3C5D] tracking-tight flex items-center gap-3">
                        {ticket.ticketCode}
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border bg-slate-50 text-slate-600`}>
                            {ticket.status.replace(/_/g, ' ')}
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">{ticket.title}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Attachments */}
                <div className="lg:col-span-1 space-y-6 text-sm">
                    {/* Meta Info */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Ticket Info</h3>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Client</p>
                            <p className="font-semibold text-slate-700">{ticket.clientId?.name}</p>
                            {ticket.clientId?.company && <p className="text-xs text-slate-500">{ticket.clientId.company}</p>}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Priority</p>
                            <p className={`font-bold ${ticket.priority === 'CRITICAL' ? 'text-red-500' : ticket.priority === 'HIGH' ? 'text-orange-500' : 'text-slate-600'}`}>
                                {ticket.priority}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Manager</p>
                            <p className="font-medium text-slate-600">{ticket.assignedManager?.name || <span className="text-slate-300 italic">Unassigned</span>}</p>
                        </div>

                        {ticket.projectId && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Project</p>
                                <p className="font-medium text-slate-600">{ticket.projectId.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">Description</h3>
                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {ticket.attachments?.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
                                <Paperclip size={12} /> Attachments ({ticket.attachments.length})
                            </h3>
                            <div className="flex flex-col gap-3">
                                {ticket.attachments.map((file, idx) => (
                                    <a key={idx} href={file.dataUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#63C132] hover:bg-white transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-[#63C132] shadow-sm shrink-0">
                                            {file.mimeType?.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-600 truncate">{file.fileName}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <ExternalLink size={14} className="text-slate-300 group-hover:text-[#63C132]" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Discussion */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px] h-[calc(100vh-12rem)]">
                    {/* Comments Window */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                        {ticket.comments?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <MessageSquare size={48} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                            </div>
                        ) : (
                            ticket.comments?.map((c, idx) => (
                                <div key={idx} className={`flex ${c.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] space-y-2`}>
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
                        {commentsLoading && (
                            <div className="flex justify-end pr-4">
                                <div className="w-5 h-5 border-2 border-[#0B3C5D] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Input Footer */}
                    <div className="p-6 bg-white border-t border-slate-100 shrink-0">
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
                                    className={`w-full p-6 pr-20 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:ring-4 transition-all resize-none min-h-[100px] max-h-[200px] font-bold text-slate-700 text-left ${isInternalComment ? 'focus:ring-amber-500/10' : 'focus:ring-blue-500/10'
                                        }`}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim() || commentsLoading}
                                    className={`absolute flex items-center justify-center right-4 bottom-4 w-12 h-12 rounded-2xl text-white shadow-lg transition-all active:scale-90 disabled:opacity-50 disabled:scale-100 ${isInternalComment
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
        </div>
    );
};

export default TicketDetail;
