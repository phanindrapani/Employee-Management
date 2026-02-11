import { eachDayOfInterval, isSunday, format } from 'date-fns';
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
export const calculateWorkingDays = async (fromDate, toDate, session = 'full-day') => {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (endDate < startDate) return 0;

    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Get holidays from DB
    const holidays = await Holiday.find({
        date: { $gte: startDate, $lte: endDate }
    });

    const holidayStrings = holidays.map(h => format(h.date, 'yyyy-MM-dd'));

    let workingDays = 0;

    for (const day of days) {
        const isSun = isSunday(day);
        const isHol = holidayStrings.includes(format(day, 'yyyy-MM-dd'));

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
