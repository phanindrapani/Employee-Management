/**
 * Shared validation utilities for worksheet entries.
 */

export const CATEGORIES = ['development', 'design', 'testing', 'meeting', 'documentation', 'research', 'support', 'other'];
export const STATUSES = ['completed', 'in-progress', 'blocked', 'pending'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

export const calcDuration = (start, end) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return e > s ? e - s : 0;
};

export const detectOverlaps = (entries) => {
    const overlapping = new Set();
    const byDate = {};
    entries.forEach((e, i) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push({ ...e, _i: i });
    });
    for (const date of Object.keys(byDate)) {
        const day = byDate[date].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        for (let i = 0; i < day.length - 1; i++) {
            if (timeToMinutes(day[i].endTime) > timeToMinutes(day[i + 1].startTime)) {
                overlapping.add(day[i]._i);
                overlapping.add(day[i + 1]._i);
            }
        }
    }
    return overlapping;
};

export const validateEntry = (entry) => {
    const errors = {};
    if (!entry.date) errors.date = 'Date is required';
    if (!entry.startTime) errors.startTime = 'Start time is required';
    if (!entry.endTime) errors.endTime = 'End time is required';
    if (!entry.taskTitle?.trim()) errors.taskTitle = 'Task title is required';
    if (entry.startTime && entry.endTime && timeToMinutes(entry.endTime) <= timeToMinutes(entry.startTime)) {
        errors.endTime = 'End time must be after start time';
    }
    return errors;
};
