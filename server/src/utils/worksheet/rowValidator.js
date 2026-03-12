const VALID_CATEGORIES = ['development', 'design', 'testing', 'meeting', 'documentation', 'research', 'support', 'other'];
const VALID_STATUSES = ['completed', 'in-progress', 'blocked', 'pending'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const mapRow = (raw) => ({
    date: raw.date || raw.Date || '',
    startTime: raw.start_time || raw.starttime || raw.startTime || raw['Start Time'] || '',
    endTime: raw.end_time || raw.endtime || raw.endTime || raw['End Time'] || '',
    durationMinutes: raw.duration_minutes || raw.durationminutes || raw.durationMinutes || raw['Duration (min)'] || '',
    taskTitle: raw.task_title || raw.tasktitle || raw.taskTitle || raw['Task Title'] || raw.task || '',
    project: raw.project || raw.Project || '',
    category: (raw.category || raw.Category || 'other').toLowerCase(),
    status: (raw.status || raw.Status || 'completed').toLowerCase(),
    priority: (raw.priority || raw.Priority || 'medium').toLowerCase(),
    notes: raw.notes || raw.Notes || '',
    tags: parseTags(raw.tags || raw.Tags || ''),
});

const parseTags = (val) => {
    if (Array.isArray(val)) return val.map(t => String(t).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(/[;,]/).map(t => t.trim()).filter(Boolean);
    return [];
};

const isValidDate = (str) => {
    if (!str) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
};

const isValidTime = (str) => {
    if (!str) return false;
    return /^\d{1,2}:\d{2}(:\d{2})?$/.test(str.trim());
};

const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export const validateRow = (row, rowIndex) => {
    const errors = [];

    if (!row.date) errors.push({ field: 'date', message: 'Date is required' });
    else if (!isValidDate(row.date)) errors.push({ field: 'date', message: `Invalid date: "${row.date}"` });

    if (!row.startTime) errors.push({ field: 'startTime', message: 'Start time is required' });
    else if (!isValidTime(row.startTime)) errors.push({ field: 'startTime', message: `Invalid time format: "${row.startTime}" (expected HH:MM)` });

    if (!row.endTime) errors.push({ field: 'endTime', message: 'End time is required' });
    else if (!isValidTime(row.endTime)) errors.push({ field: 'endTime', message: `Invalid time format: "${row.endTime}" (expected HH:MM)` });

    if (!row.taskTitle) errors.push({ field: 'taskTitle', message: 'Task title is required' });

    // Duration validation
    const dur = parseInt(row.durationMinutes, 10);
    if (isNaN(dur) || dur <= 0) {
        // Try to auto-calculate from start/end
        if (isValidTime(row.startTime) && isValidTime(row.endTime)) {
            const startMin = timeToMinutes(row.startTime);
            const endMin = timeToMinutes(row.endTime);
            const calc = endMin - startMin;
            if (calc <= 0) {
                errors.push({ field: 'durationMinutes', message: 'End time must be after start time' });
            } else {
                row.durationMinutes = calc; // auto-fix
            }
        } else {
            errors.push({ field: 'durationMinutes', message: 'Duration must be a positive number' });
        }
    } else {
        row.durationMinutes = dur;
    }

    if (row.category && !VALID_CATEGORIES.includes(row.category)) {
        row.category = 'other'; // graceful fallback
    }
    if (row.status && !VALID_STATUSES.includes(row.status)) {
        row.status = 'completed';
    }
    if (row.priority && !VALID_PRIORITIES.includes(row.priority)) {
        row.priority = 'medium';
    }

    return { valid: errors.length === 0, errors };
};

export const detectOverlaps = (rows) => {
    const overlapping = new Set();
    const byDate = {};

    rows.forEach((row, idx) => {
        if (!byDate[row.date]) byDate[row.date] = [];
        const originalIdx = Number.isInteger(row._originalIndex) ? row._originalIndex : idx;
        byDate[row.date].push({ ...row, _idx: originalIdx });
    });

    for (const date of Object.keys(byDate)) {
        const dayRows = byDate[date].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        for (let i = 0; i < dayRows.length - 1; i++) {
            const a = dayRows[i];
            const b = dayRows[i + 1];
            const aEnd = timeToMinutes(a.endTime);
            const bStart = timeToMinutes(b.startTime);
            if (bStart < aEnd) {
                overlapping.add(a._idx);
                overlapping.add(b._idx);
            }
        }
    }

    return overlapping;
};
