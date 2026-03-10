import Ticket from '../models/ticket.model.js';

/**
 * SLA Checker — Run this on a schedule (every hour).
 * Marks tickets that are past their dueDate and not yet closed as slaBreached.
 */
export const checkSLABreaches = async () => {
    try {
        const now = new Date();
        const result = await Ticket.updateMany(
            {
                dueDate: { $lt: now },
                slaBreached: false,
                status: { $nin: ['CLOSED', 'RESOLVED'] }
            },
            { $set: { slaBreached: true } }
        );

        if (result.modifiedCount > 0) {
            console.log(`[SLA] Marked ${result.modifiedCount} ticket(s) as SLA breached.`);
        }
    } catch (error) {
        console.error('[SLA] Error checking SLA breaches:', error);
    }
};
