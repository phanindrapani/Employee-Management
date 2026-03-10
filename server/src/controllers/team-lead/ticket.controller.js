import Ticket from '../../models/ticket.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

// GET /team-lead/tickets — Tickets assigned to my team (me as TL)
export const getMyTickets = async (req, res) => {
    try {
        const { status, priority } = req.query;
        const filter = { assignedTeamLead: req.user.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tickets = await Ticket.find(filter)
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedEmployee', 'name')
            .populate('projectId', 'name')
            .sort({ priority: -1, createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

// GET /team-lead/tickets/:id
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id })
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedEmployee', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

// PATCH /team-lead/tickets/:id/assign-employee
export const assignEmployee = async (req, res) => {
    try {
        const { employeeId, note } = req.body;
        const employee = await User.findOne({ _id: employeeId, role: 'employee' });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.assignedEmployee = employeeId;
        ticket.status = 'ASSIGNED';
        ticket.assignmentHistory.push({
            assignedBy: req.user.id,
            assignedTo: employeeId,
            role: 'employee',
            note: note || `Assigned to employee ${employee.name}`
        });

        await ticket.save();

        // Notify Employee
        const io = getIO();
        await Notification.create({
            user: employeeId,
            message: `New Ticket Assigned: "${ticket.title}" by Team Lead`,
            isRead: false
        });

        io.to(`user:${employeeId}`).emit('notification', {
            message: `New Ticket Assigned: "${ticket.title}"`
        });
        io.to(`user:${employeeId}`).emit('ticket:assigned', ticket);

        res.json({ message: `Ticket assigned to ${employee.name}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign employee' });
    }
};

// POST /team-lead/tickets/:id/comment
export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.comments.push({
            userId: req.user.id,
            role: 'team-lead',
            message,
            isInternal: isInternal || false
        });

        await ticket.save();

        // Notification Logic
        try {
            const io = getIO();
            if (isInternal) {
                // Notify Employee & Manager
                const notifyUserIds = [ticket.assignedEmployee, ticket.assignedManager].filter(id => id);
                for (const userId of notifyUserIds) {
                    await Notification.create({
                        user: userId,
                        message: `Internal Note from Team Lead on "${ticket.title}"`,
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
                    message: `New Message from Team Lead on ticket "${ticket.title}"`,
                    isRead: false
                });
                io.to(`user:${ticket.clientId}`).emit('notification', {
                    message: `New Message on your ticket: "${ticket.title}"`
                });
            }
        } catch (e) {
            console.error('Team lead comment notification error:', e);
        }

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// GET /team-lead/tickets/stats
export const getStats = async (req, res) => {
    try {
        const tlId = req.user.id;
        const [total, assigned, inProgress, resolved, slaBreached] = await Promise.all([
            Ticket.countDocuments({ assignedTeamLead: tlId }),
            Ticket.countDocuments({ assignedTeamLead: tlId, status: 'ASSIGNED' }),
            Ticket.countDocuments({ assignedTeamLead: tlId, status: 'IN_PROGRESS' }),
            Ticket.countDocuments({ assignedTeamLead: tlId, status: 'RESOLVED' }),
            Ticket.countDocuments({ assignedTeamLead: tlId, slaBreached: true, status: { $nin: ['CLOSED'] } })
        ]);
        res.json({ total, pendingAssignment: assigned, inProgress, resolved, slaBreached });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
