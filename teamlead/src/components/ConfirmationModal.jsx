import React from 'react';
import { AlertTriangle, Info, AlertOctagon, X, CheckCircle } from 'lucide-react';

const ConfirmationModal = ({
    title,
    message,
    confirmLabel,
    cancelLabel,
    type,
    onConfirm,
    onCancel
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertOctagon className="text-rose-600" size={32} />;
            case 'warning':
                return <AlertTriangle className="text-amber-500" size={32} />;
            case 'success':
                return <CheckCircle className="text-emerald-500" size={32} />;
            default:
                return <Info className="text-blue-500" size={32} />;
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-700 shadow-rose-200';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600 shadow-amber-200';
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
            default:
                return 'bg-[#0B3C5D] hover:bg-[#082d47] shadow-[#0B3C5D]/20';
        }
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

                <div className="relative p-10 flex flex-col items-center text-center">
                    <div className="mb-6 p-5 bg-slate-50 rounded-3xl">
                        {getIcon()}
                    </div>

                    <h2 className="text-2xl font-black text-[#0B3C5D] mb-3">
                        {title}
                    </h2>

                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${getBtnColor()}`}
                        >
                            {confirmLabel}
                        </button>
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

export default ConfirmationModal;
