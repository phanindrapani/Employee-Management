import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:5000/api';

export const options = {
    vus: 5,
    duration: '10s',
};

// Admin credentials from seed.js
const ADMIN_EMAIL = 'admin@ems.com';
const ADMIN_PASSWORD = 'adminpassword';

export function setup() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'Login successful': (r) => r.status === 200,
    });

    return { token: loginRes.json('token') };
}

export default function (data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(`${BASE_URL}/admin/clients`, params);

    const checkRes = check(res, {
        'Status is 200': (r) => r.status === 200,
        'Response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!checkRes) {
        console.log(`Request failed: ${res.status} - ${res.body}`);
    }

    sleep(1);
}
