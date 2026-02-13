import React, { useState, useEffect } from 'react';
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
    const [error, setError] = useState(null);

    // If targetUserId is provided, we fetch docs for that user.
    // Otherwise, fetch for the currently logged-in user.
    // If Admin is viewing, they can verify/reject.

    const isOwner = !targetUserId || targetUserId === authUser._id;
    const canManage = authUser.role === 'admin';
    const effectiveUserId = targetUserId || authUser._id;

    const categories = [
        { id: 'education', label: 'Education' },
        { id: 'employment', label: 'Employment' },
        { id: 'identity', label: 'Identity' },
        { id: 'other', label: 'Other' }
    ];

    const [rejectingDocId, setRejectingDocId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, [effectiveUserId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const params = targetUserId ? { userId: targetUserId } : {};
            const { data } = await API.get('/documents', { params });
            setDocuments(data);
        } catch (err) {
            console.error("Failed to load documents", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('documentName', file.name);

        try {
            setUploading(true);
            await API.post('/documents/upload', formData, {
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
            await API.delete(`/documents/${docId}`);
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
            await API.put(`/documents/${docId}/verify`);
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
            await API.put(`/documents/${docId}/reject`, { reason: rejectionReason });
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
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle size={12} /> Verified
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle size={12} /> Rejected
                </span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock size={12} /> Pending
                </span>;
        }
    };

    const docsByCategory = categories.map(cat => ({
        ...cat,
        docs: documents.filter(d => d.category === cat.id)
    }));

    if (loading) return <div className="text-center py-8 text-slate-500">Loading documents...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {docsByCategory.map(block => (
                <div key={block.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            {block.label} Documents
                        </h3>
                        {isOwner && (
                            <div className="relative">
                                <input
                                    type="file"
                                    id={`upload-${block.id}`}
                                    className="hidden"
                                    onChange={(e) => handleUpload(e, block.id)}
                                    disabled={uploading}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <label
                                    htmlFor={`upload-${block.id}`}
                                    className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors shadow-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <Upload size={14} />
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {block.docs.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                                <p className="text-sm text-slate-500 font-medium">No documents uploaded yet</p>
                                <p className="text-xs text-slate-400 mt-1">Upload relevant documents here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {block.docs.map(doc => (
                                    <div key={doc._id} className="flex flex-col gap-3 p-4 bg-white border border-slate-100 rounded-lg hover:border-slate-300 transition-all hover:shadow-sm group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                            <div className="flex items-start gap-3 mb-2 sm:mb-0">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                                        {doc.documentName}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                        <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        {getStatusBadge(doc.verificationStatus)}
                                                    </div>
                                                    {doc.rejectionReason && (
                                                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded w-fit">
                                                            <AlertTriangle size={10} />
                                                            Reason: {doc.rejectionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pl-11 sm:pl-0">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Document"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>

                                                {(isOwner && (doc.verificationStatus !== 'verified')) && (
                                                    <button
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Document"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                {canManage && doc.verificationStatus === 'pending' && !rejectingDocId && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerify(doc._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Verify"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => initiateReject(doc._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Rejection Reason Input */}
                                        {rejectingDocId === doc._id && (
                                            <div className="pl-11 pr-2 pb-2 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                        placeholder="Enter reason for rejection..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') confirmReject(doc._id);
                                                            if (e.key === 'Escape') cancelReject();
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => confirmReject(doc._id)}
                                                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                                        disabled={!rejectionReason.trim()}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={cancelReject}
                                                        className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DocumentManager;
