import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableProperties, ArrowRight } from 'lucide-react';

const Identity = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ employeeCode: '', email: '', name: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.employeeCode.trim() || !form.email.trim()) {
            setError('Employee code and email are required.');
            return;
        }
        localStorage.setItem('ws_identity', JSON.stringify({
            employeeCode: form.employeeCode.trim(),
            email: form.email.trim().toLowerCase(),
            name: form.name.trim() || form.employeeCode.trim()
        }));
        navigate('/entry');
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0B3C5D 0%, #1a5276 100%)', padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 440,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }} className="animate-in">
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16, background: '#0B3C5D',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <TableProperties size={32} color="#63C132" />
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0B3C5D', marginBottom: 6 }}>
                        Worksheet Logger
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Enter your identity to start logging work entries
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Employee Code *</label>
                        <input
                            type="text"
                            placeholder="e.g. EMP001"
                            value={form.employeeCode}
                            onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Email Address *</label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Display Name (optional)</label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" style={{
                        background: '#0B3C5D', color: 'white', border: 'none', borderRadius: 10,
                        padding: '13px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 8, transition: 'background 0.2s'
                    }}>
                        Start Logging <ArrowRight size={18} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', marginTop: 24 }}>
                    Your identity is stored locally. No server login required.
                </p>
            </div>
        </div>
    );
};

const labelStyle = {
    display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6
};
const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: '0.9rem', color: '#1e293b', outline: 'none', background: '#f8fafc',
    transition: 'border 0.2s'
};

export default Identity;
