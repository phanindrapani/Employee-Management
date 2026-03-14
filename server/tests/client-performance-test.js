import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        default: {
            executor: 'constant-vus',
            vus: 5,
            duration: '10s',
        },
    },
};

const BASE_URL = 'http://localhost:5000/api';
const CLIENT_EMAIL = 'kavya@gmail.com';
const CLIENT_PASSWORD = 'password';

export function setup() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: CLIENT_EMAIL,
        password: CLIENT_PASSWORD,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    const token = loginRes.json('token');
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // Get list of tickets that are RESOLVED or CLOSED
    const ticketsRes = http.get(`${BASE_URL}/client/tickets?status=RESOLVED`, { headers: authHeaders });
    let ticketIds = ticketsRes.json().map(t => t._id);

    if (ticketIds.length === 0) {
        const closedRes = http.get(`${BASE_URL}/client/tickets?status=CLOSED`, { headers: authHeaders });
        ticketIds = closedRes.json().map(t => t._id);
    }

    return { token, ticketIds };
}

export default function (data) {
    if (!data.ticketIds || data.ticketIds.length === 0) {
        console.log('No RESOLVED or CLOSED tickets found to reopen');
        return;
    }

    const ticketId = data.ticketIds[Math.floor(Math.random() * data.ticketIds.length)];

    const payload = JSON.stringify({
        reason: 'Testing performance of reopening tickets'
    });

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.patch(`${BASE_URL}/client/tickets/${ticketId}/reopen`, payload, params);

    const checkRes = check(res, {
        'Status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        'Response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!checkRes) {
        console.log(`Reopen failed for ID ${ticketId}: ${res.status} - ${res.body}`);
    }

    sleep(1);
}
