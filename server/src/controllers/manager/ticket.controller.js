import Ticket from '../../models/ticket.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

export const getMyTickets = async (req, res) => {
    try {
        const { status, priority, category } = req.query;
        const filter = { assignedManager: req.user.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const tickets = await Ticket.find(filter)
            .populate('clientId', 'name email company')
            .populate('assignedTeamLead', 'name')
            .populate('assignedEmployee', 'name')
            .populate('projectId', 'name')
            .sort({ priority: -1, createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedManager: req.user.id })
            .populate('clientId', 'name email company')
            .populate('assignedTeamLead', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

export const assignTeamLead = async (req, res) => {
    try {
        const { teamLeadId, note } = req.body;
        const teamLead = await User.findOne({ _id: teamLeadId, role: 'team-lead' });
        if (!teamLead) return res.status(404).json({ message: 'Team Lead not found' });

        const ticket = await Ticket.findOne({ _id: req.params.id, assignedManager: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.assignedTeamLead = teamLeadId;
        ticket.status = 'ASSIGNED';
        ticket.assignmentHistory.push({
            assignedBy: req.user.id,
            assignedTo: teamLeadId,
            role: 'team-lead',
            note: note || `Assigned to Team Lead ${teamLead.name}`
        });

        await ticket.save();

        // Notify Team Lead
        const io = getIO();
        await Notification.create({
            user: teamLeadId,
            message: `New Ticket Assigned: "${ticket.title}" by Manager`,
            isRead: false
        });

        io.to(`user:${teamLeadId}`).emit('notification', {
            message: `New Ticket Assigned: "${ticket.title}"`
        });
        io.to(`user:${teamLeadId}`).emit('ticket:assigned', ticket);

        res.json({ message: `Ticket assigned to ${teamLead.name}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign team lead' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedManager: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.comments.push({
            userId: req.user.id,
            role: 'manager',
            message,
            isInternal: isInternal || false
        });

        await ticket.save();

        // Notification Logic
        try {
            const io = getIO();
            if (isInternal) {
                // Notify Employee & Team Lead
                const notifyUserIds = [ticket.assignedEmployee, ticket.assignedTeamLead].filter(id => id);
                for (const userId of notifyUserIds) {
                    await Notification.create({
                        user: userId,
                        message: `Internal Note from Manager on "${ticket.title}"`,
                        isRead: false
                    });
                    io.to(`user:${userId}`).emit('notification', {
                        message: `Internal Note on ticket: "${ticket.title}"`
                    });
                }
            } else {
                // Notify Client
                await Notification.create({
                    user: ticket.clientId,
                    message: `New Message from Support Manager on ticket "${ticket.title}"`,
                    isRead: false
                });
                io.to(`user:${ticket.clientId}`).emit('notification', {
                    message: `New Message on your ticket: "${ticket.title}"`
                });
            }
        } catch (e) {
            console.error('Manager comment notification error:', e);
        }

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

export const getAnalytics = async (req, res) => {
    try {
        const managerId = req.user.id;
        const [total, open, inProgress, resolved, closed, slaBreached] = await Promise.all([
            Ticket.countDocuments({ assignedManager: managerId }),
            Ticket.countDocuments({ assignedManager: managerId, status: 'OPEN' }),
            Ticket.countDocuments({ assignedManager: managerId, status: 'IN_PROGRESS' }),
            Ticket.countDocuments({ assignedManager: managerId, status: 'RESOLVED' }),
            Ticket.countDocuments({ assignedManager: managerId, status: 'CLOSED' }),
            Ticket.countDocuments({ assignedManager: managerId, slaBreached: true, status: { $nin: ['RESOLVED', 'CLOSED'] } })
        ]);

        const byPriority = await Ticket.aggregate([
            { $match: { assignedManager: req.user._id } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        res.json({
            summary: { total, open, inProgress, resolved, closed, slaBreached },
            byPriority: byPriority.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {})
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

export const getStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const tickets = await Ticket.find({ assignedManager: managerId })
            .select('status slaBreached priority createdAt resolvedAt');

        const pending = tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
        const breached = tickets.filter(t => t.slaBreached && !['RESOLVED', 'CLOSED'].includes(t.status)).length;

        res.json({
            total: tickets.length,
            pending,
            breached,
            closed: tickets.filter(t => t.status === 'CLOSED').length
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
