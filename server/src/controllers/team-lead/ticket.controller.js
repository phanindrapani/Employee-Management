import mongoose from 'mongoose';
import Ticket from '../../models/ticket.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

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
            .sort({ priority: -1, createdAt: -1 })
            .lean();

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id })
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedEmployee', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role')
            .lean();

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

export const assignEmployee = async (req, res) => {
    try {
        const { employeeId, note } = req.body;
        const employee = await User.findOne({ _id: employeeId, role: 'employee' }).select('name').lean();
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id }).select('title').lean();
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, {
            $set: { assignedEmployee: employeeId, status: 'ASSIGNED' },
            $push: {
                assignmentHistory: {
                    assignedBy: req.user.id,
                    assignedTo: employeeId,
                    role: 'employee',
                    note: note || `Assigned to employee ${employee.name}`
                }
            }
        }, { new: true }).lean();

        setImmediate(async () => {
            try {
                const io = getIO();
                await Notification.create({
                    user: employeeId,
                    message: `New Ticket Assigned: "${ticket.title}" by Team Lead`,
                    isRead: false
                });

                io.to(`user:${employeeId}`).emit('notification', {
                    message: `New Ticket Assigned: "${ticket.title}"`
                });
                io.to(`user:${employeeId}`).emit('ticket:assigned', updatedTicket);
            } catch (err) {
                console.error('Background task error (assignEmployee):', err.message);
            }
        });

        res.json({ message: `Ticket assigned to ${employee.name}`, ticket: updatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign employee' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedTeamLead: req.user.id })
            .select('title clientId assignedEmployee assignedManager')
            .lean();
        
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        await Ticket.findByIdAndUpdate(req.params.id, {
            $push: {
                comments: {
                    userId: req.user.id,
                    role: 'team-lead',
                    message,
                    isInternal: !!isInternal
                }
            }
        });

        setImmediate(async () => {
            try {
                const io = getIO();
                if (isInternal) {
                    const notifyUserIds = [ticket.assignedEmployee, ticket.assignedManager].filter(Boolean);
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
                console.error('Team lead comment notification error:', e.message);
            }
        });

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

export const getStats = async (req, res) => {
    try {
        const tlId = req.user.id;
        
        const stats = await Ticket.aggregate([
            { $match: { assignedTeamLead: new mongoose.Types.ObjectId(tlId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    assigned: {
                        $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] }
                    },
                    inProgress: {
                        $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
                    },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
                    },
                    slaBreached: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$slaBreached', true] }, { $ne: ['$status', 'CLOSED'] }] },
                                1, 0
                            ]
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || { total: 0, assigned: 0, inProgress: 0, resolved: 0, slaBreached: 0 };

        res.json({
            total: result.total,
            pendingAssignment: result.assigned,
            inProgress: result.inProgress,
            resolved: result.resolved,
            slaBreached: result.slaBreached
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
