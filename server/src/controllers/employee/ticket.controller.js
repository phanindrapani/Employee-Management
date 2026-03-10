import Ticket from '../../models/ticket.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

// GET /employee/tickets — Tickets assigned to me
export const getMyTickets = async (req, res) => {
    try {
        const { status, priority } = req.query;
        const filter = { assignedEmployee: req.user.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tickets = await Ticket.find(filter)
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name')
            .populate('projectId', 'name')
            .sort({ priority: -1, createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

// GET /employee/tickets/:id
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedEmployee: req.user.id })
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

// PATCH /employee/tickets/:id/status — Update ticket status
export const updateStatus = async (req, res) => {
    try {
        const { status, resolutionNote, doubtNote } = req.body;
        const allowedStatuses = ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'DOUBT_RAISED', 'RESOLVED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const ticket = await Ticket.findOne({ _id: req.params.id, assignedEmployee: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.status = status;

        if (status === 'RESOLVED') {
            ticket.resolvedAt = new Date();
            ticket.resolutionNote = resolutionNote || null;

            // Add resolution as internal comment too
            ticket.comments.push({
                userId: req.user.id,
                role: 'employee',
                message: ` Resolved: ${resolutionNote || 'No resolution note provided'}`,
                isInternal: true
            });
        }

        if (status === 'DOUBT_RAISED') {
            ticket.doubtNote = doubtNote || null;

            // Add doubt as internal comment for history
            ticket.comments.push({
                userId: req.user.id,
                role: 'employee',
                message: `Doubt Raised: ${doubtNote || 'No detail provided'}`,
                isInternal: true
            });
        }

        await ticket.save();

        // Notification logic for DOUBT_RAISED
        if (status === 'DOUBT_RAISED') {
            try {
                const io = getIO();
                const notifyUserIds = [ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);

                for (const userId of notifyUserIds) {
                    await Notification.create({
                        user: userId,
                        message: `Doubt Raised: "${ticket.title}" by ${req.user.name}${doubtNote ? `: ${doubtNote}` : ''}`,
                        isRead: false
                    });
                    io.to(`user:${userId}`).emit('notification', {
                        message: `Doubt Raised on ticket: "${ticket.title}"`
                    });
                }
            } catch (e) {
                console.error('Notification error in updateStatus (DOUBT_RAISED):', e);
            }
        }
        res.json({ message: `Ticket status updated to ${status}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
};

// POST /employee/tickets/:id/comment
export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedEmployee: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.comments.push({
            userId: req.user.id,
            role: 'employee',
            message,
            isInternal: isInternal || false
        });

        await ticket.save();

        // Notification Logic
        try {
            const io = getIO();
            if (isInternal) {
                // Notify Team Lead & Manager for internal notes
                const notifyUserIds = [ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);
                for (const userId of notifyUserIds) {
                    await Notification.create({
                        user: userId,
                        message: `Internal Note on "${ticket.title}" by ${req.user.name}`,
                        isRead: false
                    });
                    io.to(`user:${userId}`).emit('notification', {
                        message: `Internal Note on ticket: "${ticket.title}"`
                    });
                }
            } else {
                // Notify Client for external messages
                await Notification.create({
                    user: ticket.clientId,
                    message: `New Message from Support on ticket "${ticket.title}"`,
                    isRead: false
                });
                io.to(`user:${ticket.clientId}`).emit('notification', {
                    message: `New Message on your ticket: "${ticket.title}"`
                });
            }
        } catch (e) {
            console.error('Comment notification error:', e);
        }

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// GET /employee/tickets/stats
export const getStats = async (req, res) => {
    try {
        const empId = req.user.id;
        const [total, pending, inProgress, waitingForClient, doubtRaised, resolved] = await Promise.all([
            Ticket.countDocuments({ assignedEmployee: empId }),
            Ticket.countDocuments({ assignedEmployee: empId, status: 'OPEN' }),
            Ticket.countDocuments({ assignedEmployee: empId, status: 'IN_PROGRESS' }),
            Ticket.countDocuments({ assignedEmployee: empId, status: 'WAITING_FOR_CLIENT' }),
            Ticket.countDocuments({ assignedEmployee: empId, status: 'DOUBT_RAISED' }),
            Ticket.countDocuments({ assignedEmployee: empId, status: 'RESOLVED' })
        ]);
        res.json({ total, pending, inProgress, waitingForClient, doubtRaised, resolved });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
