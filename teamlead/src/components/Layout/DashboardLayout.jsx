import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#0B3C5D] border-t-[#63C132] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    // Strict role check for Team Lead portal
    if (user.role !== 'team-lead') {
        return <Navigate to="/unauthorized" />;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans tracking-tight">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 p-10 overflow-y-auto max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
