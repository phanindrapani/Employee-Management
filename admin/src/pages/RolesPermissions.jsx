import React, { useState } from 'react';
import { Shield, Lock, Users, CheckCircle, AlertTriangle, Save } from 'lucide-react';

const RolesPermissions = () => {
    const [roles, setRoles] = useState([
        { id: 1, name: 'Admin', users: 2, description: 'Full access to all system features.' },
        { id: 2, name: 'Team Lead', users: 5, description: 'Manage teams, projects, and tasks.' },
        { id: 3, name: 'Employee', users: 24, description: 'Personal workspace and task management.' },
    ]);

    const [permissions, setPermissions] = useState({
        'Dashboard': { admin: true, teamLead: true, employee: true },
        'Employee Management': { admin: true, teamLead: true, employee: false },
        'Project Management': { admin: true, teamLead: true, employee: false },
        'Task Management': { admin: true, teamLead: true, employee: true },
        'Leave Management': { admin: true, teamLead: true, employee: true },
        'Reports & Analytics': { admin: true, teamLead: true, employee: false },
        'System Settings': { admin: true, teamLead: false, employee: false },
    });

    const handlePermissionChange = (module, role) => {
        // In a real app, this would update the backend permission configuration
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [role]: !prev[module][role]
            }
        }));
    };

    const handleSave = () => {
        // Mock save
        alert('Permissions updated successfully!');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#0B3C5D]">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7FF] rounded-xl text-[#0B3C5D]">
                    <Shield size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Roles & Permissions</h1>
                    <p className="text-slate-500 font-medium">Manage access levels and security</p>
                </div>
            </div>

            {/* Roles Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden group hover:border-[#0B3C5D]/20 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield size={64} className="text-[#0B3C5D]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#0B3C5D] mb-1">{role.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{role.description}</p>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <Users size={14} />
                            <span>{role.users} Active Users</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Permission Matrix */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-[#0B3C5D]">Access Control Matrix</h3>
                        <p className="text-sm text-slate-500">Define what each role can access</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="btn-primary flex items-center gap-2 !py-2 !px-4 !text-xs"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[#0B3C5D]">
                                <th className="p-4 font-black uppercase text-xs tracking-wider border-b border-slate-100">Module</th>
                                <th className="p-4 font-black uppercase text-xs tracking-wider border-b border-slate-100 text-center">Admin</th>
                                <th className="p-4 font-black uppercase text-xs tracking-wider border-b border-slate-100 text-center">Team Lead</th>
                                <th className="p-4 font-black uppercase text-xs tracking-wider border-b border-slate-100 text-center">Employee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(permissions).map(([module, rolePerms]) => (
                                <tr key={module} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <td className="p-4 font-bold text-slate-700">{module}</td>

                                    {/* Admin - Always True/Disabled usually, but keeping editable for demo */}
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rolePerms.admin}
                                                    onChange={() => handlePermissionChange(module, 'admin')}
                                                    className="sr-only peer"
                                                    disabled // Admin usually shouldn't lose access
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0B3C5D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3C5D] opacity-50 cursor-not-allowed"></div>
                                            </label>
                                        </div>
                                    </td>

                                    {/* Team Lead */}
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rolePerms.teamLead}
                                                    onChange={() => handlePermissionChange(module, 'teamLead')}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0B3C5D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3C5D]"></div>
                                            </label>
                                        </div>
                                    </td>

                                    {/* Employee */}
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rolePerms.employee}
                                                    onChange={() => handlePermissionChange(module, 'employee')}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0B3C5D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B3C5D]"></div>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm font-medium border border-amber-100">
                <AlertTriangle size={16} />
                <span>Note: Changing permissions for the <strong>Admin</strong> role is restricted to maintain system integrity.</span>
            </div>
        </div>
    );
};

export default RolesPermissions;
