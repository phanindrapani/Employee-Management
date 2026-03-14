import mongoose from 'mongoose';
import Ticket from '../../models/ticket.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';

export const getMyTickets = async (req, res) => {
    try {
        const { status, priority, category } = req.query;
        const managerId = req.user.id;
        const filter = { assignedManager: managerId };
        
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const tickets = await Ticket.find(filter)
            .select('ticketCode title description status priority category clientId assignedTeamLead assignedEmployee projectId createdAt updatedAt')
            .populate('clientId', 'name email company')
            .populate('assignedTeamLead', 'name')
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
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedManager: req.user.id })
            .select({
                assignmentHistory: { $slice: -10 },
                comments: { $slice: -10 }
            })
            .populate('clientId', 'name email company')
            .populate('assignedTeamLead', 'name email')
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

export const assignTeamLead = async (req, res) => {
    try {
        const { teamLeadId, note } = req.body;
        const managerId = req.user.id;

        const teamLead = await User.findOne({ _id: teamLeadId, role: 'team-lead' }).select('name').lean();
        if (!teamLead) return res.status(404).json({ message: 'Team Lead not found' });

        const assignmentEntry = {
            assignedBy: managerId,
            assignedTo: teamLeadId,
            role: 'team-lead',
            note: note || `Assigned to Team Lead ${teamLead.name}`,
            assignedAt: new Date()
        };

        const ticket = await Ticket.findOneAndUpdate(
            { _id: req.params.id, assignedManager: managerId },
            { 
                $set: { 
                    assignedTeamLead: teamLeadId,
                    status: 'ASSIGNED'
                },
                $push: { assignmentHistory: assignmentEntry }
            },
            { new: true }
        ).select('title ticketCode').lean();

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Background Notifications
        setImmediate(async () => {
            try {
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
            } catch (err) {
                console.error('Background Assign Notification Error:', err);
            }
        });

        res.json({ message: `Ticket assigned to ${teamLead.name}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign team lead' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const managerId = req.user.id;

        const commentEntry = {
            userId: managerId,
            role: 'manager',
            message,
            isInternal: isInternal || false,
            createdAt: new Date()
        };

        const ticket = await Ticket.findOneAndUpdate(
            { _id: req.params.id, assignedManager: managerId },
            { $push: { comments: commentEntry } },
            { new: true }
        ).select('title clientId assignedEmployee assignedTeamLead').lean();

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Background Notifications
        setImmediate(async () => {
            try {
                const io = getIO();
                if (isInternal) {
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
                    await Notification.create({
                        user: ticket.clientId,
                        message: `New Message from Support Manager on ticket "${ticket.title}"`,
                        isRead: false
                    });
                    io.to(`user:${ticket.clientId}`).emit('notification', {
                        message: `New Message on your ticket: "${ticket.title}"`
                    });
                }
            } catch (err) {
                console.error('Background Comment Notification Error:', err);
            }
        });

        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

export const getAnalytics = async (req, res) => {
    try {
        const managerId = req.user.id;
        const managerObjectId = new mongoose.Types.ObjectId(managerId);

        const [summary, byPriority] = await Promise.all([
            Ticket.aggregate([
                { $match: { assignedManager: managerObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
                        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
                        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                        slaBreached: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$slaBreached', true] },
                                            { $not: { $in: ['$status', ['RESOLVED', 'CLOSED']] } }
                                        ]
                                    },
                                    1, 0
                                ]
                            }
                        }
                    }
                }
            ]).then(res => res[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, slaBreached: 0 }),
            Ticket.aggregate([
                { $match: { assignedManager: managerObjectId } },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            summary,
            byPriority: byPriority.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {})
        });
    } catch (error) {
        console.error('Error in getAnalytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

export const getStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const managerObjectId = new mongoose.Types.ObjectId(managerId);

        const stats = await Ticket.aggregate([
            { $match: { assignedManager: managerObjectId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                    pending: {
                        $sum: {
                            $cond: [{ $not: { $in: ['$status', ['RESOLVED', 'CLOSED']] } }, 1, 0]
                        }
                    },
                    breached: {
                        $sum: {
                            $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$slaBreached', true] },
                                            { $not: { $in: ['$status', ['RESOLVED', 'CLOSED']] } }
                                        ]
                                    },
                                1, 0
                            ]
                        }
                    }
                }
            }
        ]).then(res => res[0] || { total: 0, closed: 0, pending: 0, breached: 0 });

        res.json(stats);
    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
