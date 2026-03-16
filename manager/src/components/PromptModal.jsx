import React, { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';

const PromptModal = ({
    title,
    message,
    placeholder,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel
}) => {
    const [value, setValue] = useState('');

    const handleConfirm = () => {
        if (!value.trim()) return;
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0B3C5D]/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-slate-50 rounded-full" />

                <div className="relative p-10 flex flex-col items-center">
                    <div className="mb-6 p-5 bg-slate-50 text-[#0B3C5D] rounded-3xl">
                        <HelpCircle size={32} />
                    </div>

                    <h2 className="text-2xl font-black text-[#0B3C5D] mb-3 text-center">
                        {title}
                    </h2>

                    <p className="text-slate-500 font-medium leading-relaxed mb-8 text-center">
                        {message}
                    </p>

                    <div className="w-full space-y-6">
                        <textarea
                            autoFocus
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#0B3C5D] focus:ring-2 focus:ring-[#0B3C5D]/10 transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!value.trim()}
                                className="flex-1 px-6 py-4 bg-[#0B3C5D] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-[#0B3C5D]/20 hover:bg-[#082d47] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={14} />
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default PromptModal;
