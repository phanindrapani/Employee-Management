import { isSunday } from 'date-fns';
import Holiday from '../models/holiday.model.js';

/**
 * Calculates total working days between two dates, 
 * excluding Sundays and holidays from the database.
 * 
 * @param {Date} fromDate 
 * @param {Date} toDate 
 * @param {string} session - 'full-day', 'half-morning', 'half-afternoon'
 * @returns {Promise<number>} totalDays
 */
const parseDateOnly = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    return new Date(value);
};

const normalizeToLocalDate = (value) => {
    const d = parseDateOnly(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const getLocalDateKey = (value) => {
    const d = normalizeToLocalDate(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const calculateWorkingDays = async (fromDate, toDate, session = 'full-day') => {
    const startDate = normalizeToLocalDate(fromDate);
    const endDate = normalizeToLocalDate(toDate);

    if (endDate < startDate) return 0;

    // Get holidays from DB
    const endExclusive = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
    const holidays = await Holiday.find({
        date: { $gte: startDate, $lt: endExclusive }
    });

    const holidayStrings = holidays.map(h => getLocalDateKey(h.date));

    let workingDays = 0;

    for (let day = new Date(startDate); day <= endDate; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
        const isSun = isSunday(day);
        const isHol = holidayStrings.includes(getLocalDateKey(day));

        if (!isSun && !isHol) {
            workingDays++;
        }
    }

    // Handle half-day logic
    if (workingDays === 1 && session !== 'full-day') {
        return 0.5;
    }

    // If it's a range and the first/last day is half, we'd need more complex logic,
    // but for now we follow the requirement: if totalDays = 0 -> error.
    // The system expects employee to select session.

    return workingDays;
};
