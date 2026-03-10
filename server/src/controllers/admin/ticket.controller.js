import Ticket from '../../models/ticket.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

// GET /admin/tickets — All tickets with filters
export const getAllTickets = async (req, res) => {
    try {
        const { status, priority, category, assignedManager, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedManager) filter.assignedManager = assignedManager;
        if (search) {
            filter.$or = [
                { ticketCode: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate('clientId', 'name email company')
                .populate('assignedManager', 'name')
                .populate('assignedTeamLead', 'name')
                .populate('assignedEmployee', 'name')
                .populate('projectId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Ticket.countDocuments(filter)
        ]);

        res.json({ tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

// GET /admin/tickets/analytics — System-wide stats
export const getAnalytics = async (req, res) => {
    try {
        const [
            total, open, assigned, inProgress, waitingForClient,
            resolved, closed, reopened, slaBreached,
            byPriority, byCategory
        ] = await Promise.all([
            Ticket.countDocuments(),
            Ticket.countDocuments({ status: 'OPEN' }),
            Ticket.countDocuments({ status: 'ASSIGNED' }),
            Ticket.countDocuments({ status: 'IN_PROGRESS' }),
            Ticket.countDocuments({ status: 'WAITING_FOR_CLIENT' }),
            Ticket.countDocuments({ status: 'RESOLVED' }),
            Ticket.countDocuments({ status: 'CLOSED' }),
            Ticket.countDocuments({ status: 'REOPENED' }),
            Ticket.countDocuments({ slaBreached: true, status: { $nin: ['CLOSED'] } }),
            Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
            Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
        ]);

        // Average resolution time (closed tickets)
        const closedTickets = await Ticket.find({ status: 'CLOSED', resolvedAt: { $ne: null } })
            .select('createdAt resolvedAt');
        const avgResolutionHours = closedTickets.length > 0
            ? closedTickets.reduce((sum, t) =>
                sum + (t.resolvedAt - t.createdAt) / (1000 * 60 * 60), 0) / closedTickets.length
            : 0;

        res.json({
            summary: { total, open, assigned, inProgress, waitingForClient, resolved, closed, reopened, slaBreached },
            byPriority: byPriority.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
            byCategory: byCategory.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
            avgResolutionHours: Math.round(avgResolutionHours * 10) / 10
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

// GET /admin/tickets/:id — Single ticket detail
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('clientId', 'name email company clientCode')
            .populate('assignedManager', 'name email')
            .populate('assignedTeamLead', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role')
            .populate('assignmentHistory.assignedBy', 'name')
            .populate('assignmentHistory.assignedTo', 'name');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

// PATCH /admin/tickets/:id/assign-manager — Assign to a manager
export const assignManager = async (req, res) => {
    try {
        const { managerId, note } = req.body;
        const manager = await User.findOne({ _id: managerId, role: 'manager' });
        if (!manager) return res.status(404).json({ message: 'Manager not found' });

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.assignedManager = managerId;
        ticket.status = 'ASSIGNED';
        ticket.assignmentHistory.push({
            assignedBy: req.user.id,
            assignedTo: managerId,
            role: 'manager',
            note: note || `Assigned to manager ${manager.name}`
        });

        await ticket.save();

        // Notify Manager
        const io = getIO();
        await Notification.create({
            user: managerId,
            message: `New Ticket Assigned: "${ticket.title}" by Admin`,
            isRead: false
        });

        io.to(`user:${managerId}`).emit('notification', {
            message: `New Ticket Assigned: "${ticket.title}"`
        });
        io.to(`user:${managerId}`).emit('ticket:assigned', ticket);
        io.emit('ticket:updated', ticket);

        res.json({ message: `Ticket assigned to manager ${manager.name}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign manager' });
    }
};

// PATCH /admin/tickets/:id/close — Close a ticket
export const closeTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (!['RESOLVED'].includes(ticket.status)) {
            return res.status(400).json({ message: 'Only RESOLVED tickets can be closed' });
        }

        ticket.status = 'CLOSED';
        ticket.closedAt = new Date();
        await ticket.save();

        const io = getIO();
        io.emit('ticket:updated', ticket);

        res.json({ message: 'Ticket closed', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to close ticket' });
    }
};

// POST /admin/tickets/:id/comment
export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.comments.push({
            userId: req.user.id,
            role: 'admin',
            message,
            isInternal: isInternal || false
        });

        await ticket.save();

        // Notification Logic
        try {
            const io = getIO();
            io.emit('ticket:updated', ticket);

            if (isInternal) {
                // Notify assigned staff
                const notifyUserIds = [ticket.assignedEmployee, ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);
                for (const userId of notifyUserIds) {
                    await Notification.create({
                        user: userId,
                        message: `Internal Note from ADMIN on "${ticket.title}"`,
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
                    message: `New Message from Support Admin on ticket "${ticket.title}"`,
                    isRead: false
                });
                io.to(`user:${ticket.clientId}`).emit('notification', {
                    message: `New Message on your ticket: "${ticket.title}"`
                });
            }
        } catch (e) {
            console.error('Admin comment notification error:', e);
        }

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// GET /admin/tickets/unassigned
export const getUnassignedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ status: 'OPEN', assignedManager: null })
            .populate('clientId', 'name email company')
            .sort({ priority: -1, createdAt: 1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch unassigned tickets' });
    }
};

// GET /admin/tickets/sla-breached
export const getSLABreachedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ slaBreached: true, status: { $nin: ['CLOSED'] } })
            .populate('clientId', 'name email')
            .populate('assignedManager', 'name')
            .populate('assignedEmployee', 'name')
            .sort({ dueDate: 1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch SLA breached tickets' });
    }
};
