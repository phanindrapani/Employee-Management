import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import DocumentManager from '../../components/DocumentManager';

const Documents = () => {
    const [lastSync, setLastSync] = useState(localStorage.getItem('ls_docs_sync_time') || 'Never');

    useEffect(() => {
        const timer = setTimeout(() => {
            const now = new Date().toLocaleTimeString();
            setLastSync(now);
            localStorage.setItem('ls_docs_sync_time', now);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#F0F7FF] flex items-center justify-center text-[#0B3C5D] font-black text-2xl border border-[#0B3C5D]/10 overflow-hidden shadow-sm">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">My Documents</h1>
                        <p className="text-slate-500 font-medium italic">Manage and verify your corporate records</p>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <div className="px-4 py-2 bg-emerald-50 rounded-xl text-emerald-700 font-bold text-[10px] uppercase tracking-widest border border-emerald-100 mb-1 flex items-center gap-2">
                        <ShieldCheck size={12} />
                        Document Security
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic">Last Sync: {lastSync}</span>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-50 p-2 md:p-6">
                <DocumentManager />
            </div>
        </div>
    );
};

export default Documents;
