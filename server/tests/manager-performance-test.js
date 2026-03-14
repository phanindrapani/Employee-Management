import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        default: {
            executor: 'constant-vus',
            vus: 15,
            duration: '20s',
        },
    },
};

const BASE_URL = 'http://localhost:5000/api';
const PARAMS = {
    timeout: '60s',
};
const MANAGER_EMAIL = 'manager@ems.com';
const MANAGER_PASSWORD = 'password123';

export function setup() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: MANAGER_EMAIL,
        password: MANAGER_PASSWORD,
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

    // Test Manager Worklog Analysis
    const res = http.get(`${BASE_URL}/manager/worklogs/analysis`, params);

    check(res, {
        'Status is 200': (r) => r.status === 200,
        'Response time < 2s': (r) => r.timings.duration < 2000,
    });

    sleep(1);
}
