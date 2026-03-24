import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:5000/api';

export const options = {
    scenarios: {
        team_leads: {
            executor: 'constant-vus',
            exec: 'teamLeadsTest',
            vus: 5,
            duration: '10s',
        },
        promote_user: {
            executor: 'constant-vus',
            exec: 'promoteUserTest',
            vus: 5,
            duration: '10s',
            startTime: '12s', // Start after team_leads finished
        },
    },
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

    const token = loginRes.json('token');

    // Fetch an employee to get a valid ID for promotion test
    const empRes = http.get(`${BASE_URL}/admin/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const employees = empRes.json();
    const empId = employees.length > 0 ? employees[0]._id : null;

    return { token, empId };
}

export function teamLeadsTest(data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(`${BASE_URL}/admin/employees/team-leads`, params);
    check(res, {
        'Get TeamLeads: Status is 200': (r) => r.status === 200,
        'Get TeamLeads: Response time < 500ms': (r) => r.timings.duration < 500,
    });
    sleep(1);
}

export function promoteUserTest(data) {
    if (!data.empId) return;

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(`${BASE_URL}/admin/employees/promote/${data.empId}`, params);
    check(res, {
        'Promote User: Status is 200': (r) => r.status === 200,
        'Promote User: Response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    sleep(1);
}
