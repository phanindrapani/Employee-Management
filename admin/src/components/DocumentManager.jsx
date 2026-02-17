import React, { useState, useEffect } from 'react';
import useSocketListener from '../hooks/useSocketListener';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FileText, Upload, CheckCircle, XCircle, Clock,
    Trash2, ExternalLink, AlertTriangle
} from 'lucide-react';

const DocumentManager = ({ targetUserId }) => {
    const { user: authUser } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const effectiveUserId = targetUserId || authUser._id;
    const isOwner = !targetUserId || targetUserId === authUser._id;
    const canManage = authUser.role === 'admin';

    const documentGroups = [
        {
            title: 'Academic Records',
            category: 'education',
            slots: [
                { id: '10th', label: '10th / Secondary Marksheet', required: true },
                { id: 'Intermediate', label: 'Intermediate / 12th Marksheet', required: true },
                { id: 'Graduation', label: 'Graduation Degree / Certificate', required: true },
            ]
        },
        {
            title: 'Professional Documents',
            category: 'employment',
            slots: [
                { id: 'Resume', label: 'Latest Resume / CV', required: true },
                { id: 'OfferLetter', label: 'Company Offer Letter', required: true },
                { id: 'JoiningLetter', label: 'Joining & Appointment Letter', required: true },
            ]
        },
        {
            title: 'Identity Verification',
            category: 'identity',
            slots: [
                { id: 'Aadhar', label: 'Aadhar Card (Front & Back)', required: true },
                { id: 'PAN', label: 'PAN Card Copy', required: true },
            ]
        },
        {
            title: 'General Documents',
            category: 'other',
            slots: [
                { id: 'Other', label: 'Other Miscellaneous Documents', required: false },
            ]
        }
    ];

    const [rejectingDocId, setRejectingDocId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, [effectiveUserId]);

    useSocketListener('document:uploaded', fetchDocuments);
    useSocketListener('document:verified', fetchDocuments);
    useSocketListener('document:rejected', fetchDocuments);
    useSocketListener('document:deleted', fetchDocuments);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const params = targetUserId ? { userId: targetUserId } : {};
            const { data } = await API.get('/admin/documents', { params });
            setDocuments(data);
        } catch (err) {
            console.error("Failed to load documents", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e, category, customName) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('documentName', customName);

        try {
            setUploading(true);
            await API.post('/admin/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocuments();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await API.delete(`/admin/documents/${docId}`);
            setDocuments(prev => prev.filter(d => d._id !== docId));
        } catch (err) {
            console.error("Failed to delete document", err);
        }
    };

    const handleVerify = async (docId) => {
        try {
            setDocuments(prev => prev.map(d =>
                d._id === docId ? { ...d, verificationStatus: 'verified' } : d
            ));
            await API.put(`/admin/documents/${docId}/verify`);
            await fetchDocuments();
        } catch (err) {
            console.error("Verification failed", err);
            fetchDocuments();
        }
    };

    const initiateReject = (docId) => {
        setRejectingDocId(docId);
        setRejectionReason('');
    };

    const cancelReject = () => {
        setRejectingDocId(null);
        setRejectionReason('');
    };

    const confirmReject = async (docId) => {
        if (!rejectionReason.trim()) return;

        try {
            setDocuments(prev => prev.map(d =>
                d._id === docId ? { ...d, verificationStatus: 'rejected', rejectionReason: rejectionReason } : d
            ));
            await API.put(`/admin/documents/${docId}/reject`, { reason: rejectionReason });
            await fetchDocuments();
            setRejectingDocId(null);
            setRejectionReason('');
        } catch (err) {
            console.error("Rejection failed", err);
            fetchDocuments();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest"><CheckCircle size={10} /> Verified</span>;
            case 'rejected':
                return <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 uppercase tracking-widest"><XCircle size={10} /> Rejected</span>;
            default:
                return <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-widest"><Clock size={10} /> Pending</span>;
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse p-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-slate-50 rounded-[32px]"></div>)}
        </div>
    );

    return (
        <div className="space-y-12">
            {documentGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{group.title}</h3>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {group.slots.map((slot) => {
                            const slotDocs = documents.filter(d => d.documentName === slot.label);
                            const hasDocs = slotDocs.length > 0;

                            return (
                                <div key={slot.id} className={`p-8 rounded-[32px] border transition-all duration-300 ${hasDocs ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-xs font-black text-[#0B3C5D] mb-1">{slot.label}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                                                {slot.required ? 'Required Document' : 'Optional Document'}
                                            </p>
                                        </div>
                                        {hasDocs ? (
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                                <FileText size={20} />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-slate-100 text-slate-300 rounded-xl">
                                                <Upload size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {hasDocs ? (
                                        <div className="space-y-4">
                                            {slotDocs.map(doc => (
                                                <div key={doc._id} className="space-y-3">
                                                    <div className="flex items-center justify-between bg-white border border-slate-50 p-3 rounded-2xl shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            {getStatusBadge(doc.verificationStatus)}
                                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-[#0B3C5D] transition-colors"><ExternalLink size={16} /></a>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {canManage && doc.verificationStatus === 'pending' && !rejectingDocId && (
                                                                <>
                                                                    <button onClick={() => handleVerify(doc._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Verify"><CheckCircle size={18} /></button>
                                                                    <button onClick={() => initiateReject(doc._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Reject"><XCircle size={18} /></button>
                                                                </>
                                                            )}
                                                            {isOwner && doc.verificationStatus !== 'verified' && (
                                                                <button onClick={() => handleDelete(doc._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {rejectingDocId === doc._id && (
                                                        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-2 text-xs border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                                                placeholder="Reason for rejection..."
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => confirmReject(doc._id)} className="flex-1 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700">Confirm Reject</button>
                                                                <button onClick={cancelReject} className="px-4 py-2 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200">Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {doc.rejectionReason && (
                                                        <div className="text-[10px] text-rose-600 font-black uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-rose-100">
                                                            <AlertTriangle size={12} /> Reason: {doc.rejectionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        isOwner && (
                                            <div className="mt-4">
                                                <input
                                                    type="file"
                                                    id={`upload-${slot.id}`}
                                                    className="hidden"
                                                    onChange={(e) => handleUpload(e, group.category, slot.label)}
                                                    disabled={uploading}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <label
                                                    htmlFor={`upload-${slot.id}`}
                                                    className={`w-full py-3 bg-[#F0F7FF] text-[#0B3C5D] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#0B3C5D] hover:text-white transition-all cursor-pointer flex justify-center items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {uploading ? 'Processing...' : 'Click to Upload'}
                                                </label>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DocumentManager;
