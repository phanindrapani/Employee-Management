import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        default: {
            executor: 'constant-vus',
            vus: 100,
            duration: '30s',
        },
    },
};

const BASE_URL = 'http://localhost:5000/api';
http.setResponseCallback(null);
const PARAMS = {
    timeout: '60s',
};
const EMPLOYEE_EMAIL = 'jane.dev@ems.com';
const EMPLOYEE_PASSWORD = 'password123';

export function setup() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: EMPLOYEE_EMAIL,
        password: EMPLOYEE_PASSWORD,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status !== 200) {
        console.log(`Login failed during setup: ${loginRes.status} - ${loginRes.body}`);
        return { token: null };
    }

    const token = loginRes.json('token');
    return { token };
}

export default function (data) {
    if (!data.token) return;

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        timeout: PARAMS.timeout,
    };

    // Test GET /api/employee/worksheet/analysis
    const res = http.get(`${BASE_URL}/employee/worksheet/analysis`, params);

    check(res, {
        'Status is 200': (r) => r.status === 200,
        'Response time < 500ms': (r) => r.timings.duration < 4000,
        'Has totalHours': (r) => r.json().totalHours !== undefined,
        'Has trend array': (r) => Array.isArray(r.json().trend),
    });

    if (res.status !== 200) {
        console.log(`Worksheet analysis fetch failed: ${res.status} - ${res.body}`);
    }

    sleep(1);
}
