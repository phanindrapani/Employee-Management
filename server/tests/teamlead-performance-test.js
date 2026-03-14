import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        default: {
            executor: 'constant-vus',
            vus: 25,
            duration: '30s',
        },
    },
};

const BASE_URL = 'http://localhost:5000/api';
const PARAMS = {
    timeout: '60s',
};
const TEAM_LEAD_EMAIL = 'john.dev@ems.com';
const TEAM_LEAD_PASSWORD = 'password123';

export function setup() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: TEAM_LEAD_EMAIL,
        password: TEAM_LEAD_PASSWORD,
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

    // 1. Test Worklogs List
    const logsRes = http.get(`${BASE_URL}/team-lead/worklogs`, params);
    check(logsRes, {
        'Logs: Status is 200': (r) => r.status === 200,
        'Logs: Response time < 500ms': (r) => r.timings.duration < 500,
    });

    // 2. Test Worklog Stats
    const statsRes = http.get(`${BASE_URL}/team-lead/worklogs/stats`, params);
    check(statsRes, {
        'Stats: Status is 200': (r) => r.status === 200,
        'Stats: Response time < 500ms': (r) => r.timings.duration < 500,
    });

    // 3. Test Worklog Analysis
    const analysisRes = http.get(`${BASE_URL}/team-lead/worklogs/analysis`, params);
    check(analysisRes, {
        'Analysis: Status is 200': (r) => r.status === 200,
        'Analysis: Response time < 1s': (r) => r.timings.duration < 1000,
    });

    sleep(1);
}
