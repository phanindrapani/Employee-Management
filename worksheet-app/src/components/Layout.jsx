import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileEdit, History, Download, LogOut, TableProperties } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const identity = JSON.parse(localStorage.getItem('ws_identity') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('ws_identity');
        navigate('/identity');
    };

    const navItems = [
        { path: '/entry', label: 'Log Entry', icon: FileEdit },
        { path: '/history', label: 'History', icon: History },
        { path: '/export', label: 'Export Center', icon: Download },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: 240, background: 'var(--primary)', color: 'white',
                display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh'
            }}>
                <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <TableProperties size={22} color="#63C132" />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#63C132' }}>Worksheet</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>{identity.name || identity.employeeCode}</div>
                        <div>{identity.email}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '16px 12px' }}>
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink key={path} to={path} style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: 8, marginBottom: 4, fontSize: '0.88rem', fontWeight: 500,
                            color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                            background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                            borderLeft: isActive ? '3px solid #63C132' : '3px solid transparent',
                            transition: 'all 0.15s'
                        })}>
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                        color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', cursor: 'pointer'
                    }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
