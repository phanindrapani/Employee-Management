import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    if (!found) return fallback;
    return found.slice(name.length + 3);
};

const API_BASE = getArg('base', process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`);
const email = getArg('email', process.env.ADMIN_EMAIL || '');
const password = getArg('password', process.env.ADMIN_PASSWORD || '');

if (!email || !password) {
    console.error('Missing credentials. Provide --email and --password (or ADMIN_EMAIL and ADMIN_PASSWORD in env).');
    process.exit(1);
}

try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
        const err = await loginRes.json().catch(() => ({}));
        throw new Error(`Login failed (${loginRes.status}): ${err.message || 'Unknown error'}`);
    }

    const loginData = await loginRes.json();
    const token = loginData?.token;

    if (!token) {
        throw new Error('Login succeeded but token was not returned.');
    }

    const reconcileRes = await fetch(`${API_BASE}/admin/leaves/reconcile-balances`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    const result = await reconcileRes.json().catch(() => ({}));
    if (!reconcileRes.ok) {
        throw new Error(`Reconcile failed (${reconcileRes.status}): ${result.message || result.msg || 'Unknown error'}${result.details ? ` | ${result.details}` : ''}`);
    }

    console.log('Leave balance reconciliation completed.');
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error(error.message || error);
    process.exit(1);
}
