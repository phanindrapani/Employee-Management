import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { User, Mail, Phone, Shield, ArrowLeft, FileText, Briefcase } from 'lucide-react';
import DocumentManager from '../components/DocumentManager';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('documents'); // Default to documents for admin convenience

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                // We reuse the admin/employees/:id endpoint if it exists or fetch from list
                // Since there isn't a dedicated single-user fetch for admin in previous controller (only update/delete),
                // we might need to rely on the generic list or add a get-one endpoint.
                // However, let's try generic fetch or assume we need to add a controller method.
                // Wait, admin.controller.js didn't have getEmployeeById. 
                // I should add it, or just filter from the all-employees list if performance allows, 
                // but proper way is getById.
                // For now, I'll use the existing /auth/profile if I could impersonate, but I can't.

                // Let's check admin.controller.js again.
                // It has getAllEmployees.
                // I will add getEmployeeById to admin controller quickly.
                const { data } = await API.get(`/admin/employees/${id}`);
                setEmployee(data);
            } catch (err) {
                console.error("Failed to fetch employee");
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id]);

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!employee) return <div className="text-center py-10">Employee not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/employees')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-500" />
                </button>
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{employee.name}</h1>
                    <p className="text-slate-500 font-medium">Employee Profile & Documents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Snapshot */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 text-center">
                        <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-slate-400 overflow-hidden">
                            {employee.profilePicture ? (
                                <img src={employee.profilePicture} alt={employee.name} className="w-full h-full object-cover" />
                            ) : (
                                employee.name.charAt(0)
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-[#0B3C5D]">{employee.name}</h2>
                        <p className="text-slate-500">{employee.role}</p>

                        <div className="mt-6 space-y-3 text-left">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Mail size={16} className="text-slate-400" />
                                {employee.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                {employee.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Briefcase size={16} className="text-slate-400" />
                                {employee.department?.name || 'No Department'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex p-1 bg-slate-100/80 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'documents'
                                    ? 'bg-white text-[#0B3C5D] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FileText size={16} />
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'details'
                                    ? 'bg-white text-[#0B3C5D] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Details
                        </button>
                    </div>

                    {activeTab === 'documents' ? (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-[#0B3C5D]">Employee Documents</h3>
                                <p className="text-slate-500 text-sm">Verify uploaded documents</p>
                            </div>
                            <DocumentManager targetUserId={id} />
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-[#0B3C5D] mb-4">Extended Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Reporting Manager</label>
                                    <p className="font-medium text-slate-700">{employee.reportingManager?.name || 'None'}</p>
                                </div>
                                <div>
                                    <label className="label">Skills</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {employee.skills?.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetails;
