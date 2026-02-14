import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-[#0B3C5D]">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 text-center border border-slate-100">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100">
                    <ShieldAlert size={40} />
                </div>

                <h1 className="text-3xl font-black mb-4 tracking-tight">Access Denied</h1>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    You do not have the required permissions to access this portal. Please contact your administrator if you believe this is an error.
                </p>

                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#0B3C5D] text-white font-bold rounded-2xl hover:bg-[#1A4B6D] transition-all transform hover:scale-[1.02] shadow-lg shadow-[#0B3C5D]/20"
                >
                    <ArrowLeft size={20} />
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
