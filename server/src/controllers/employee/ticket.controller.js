import Ticket from '../../models/ticket.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';
import mongoose from 'mongoose';
export const getMyTickets = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const filter = { assignedEmployee: req.user._id || req.user.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const ticketsFlat = await Ticket.find(filter)
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name')
            .populate('projectId', 'name')
            .select('title status priority createdAt ticketCode clientId assignedManager assignedTeamLead projectId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Ticket.countDocuments(filter);

        res.json({
            tickets: ticketsFlat,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticket = await Ticket.findOne({ _id: req.params.id, assignedEmployee: userId })
            .populate('clientId', 'name email company')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name email')
            .populate('projectId', 'name')
            .populate('comments.userId', 'name role')
            .lean();

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { status, resolutionNote, doubtNote } = req.body;
        const allowedStatuses = ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'DOUBT_RAISED', 'RESOLVED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const userId = req.user._id || req.user.id;
        const update = { status };
        const push = {};

        if (status === 'RESOLVED') {
            update.resolvedAt = new Date();
            update.resolutionNote = resolutionNote || null;
            push.comments = {
                userId: userId,
                role: 'employee',
                message: ` Resolved: ${resolutionNote || 'No resolution note provided'}`,
                isInternal: true
            };
        }

        if (status === 'DOUBT_RAISED') {
            update.doubtNote = doubtNote || null;
            push.comments = {
                userId: userId,
                role: 'employee',
                message: `Doubt Raised: ${doubtNote || 'No detail provided'}`,
                isInternal: true
            };
        }

        const queryObject = { _id: req.params.id, assignedEmployee: userId };
        const updateObject = { $set: update };
        if (push.comments) updateObject.$push = push;

        const ticket = await Ticket.findOneAndUpdate(queryObject, updateObject, { new: true }).lean();
        
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (status === 'DOUBT_RAISED') {
            setImmediate(async () => {
                try {
                    const io = getIO();
                    const notifyUserIds = [ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);

                    for (const targetId of notifyUserIds) {
                        await Notification.create({
                            user: targetId,
                            message: `Doubt Raised: "${ticket.title}" by ${req.user.name}${doubtNote ? `: ${doubtNote}` : ''}`,
                            isRead: false
                        });
                        io.to(`user:${targetId}`).emit('notification', {
                            message: `Doubt Raised on ticket: "${ticket.title}"`
                        });
                    }
                } catch (e) {
                    console.error('Background Notification error (DOUBT_RAISED):', e);
                }
            });
        }

        res.json({ message: `Ticket status updated to ${status}`, ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const userId = req.user._id || req.user.id;
        
        const update = {
            $push: {
                comments: {
                    userId: userId,
                    role: 'employee',
                    message,
                    isInternal: isInternal || false,
                    createdAt: new Date()
                }
            }
        };

        const ticket = await Ticket.findOneAndUpdate(
            { _id: req.params.id, assignedEmployee: userId },
            update,
            { new: true, select: 'title clientId assignedTeamLead assignedManager' }
        ).lean();

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        setImmediate(async () => {
            try {
                const io = getIO();
                if (isInternal) {
                    const notifyUserIds = [ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);
                    for (const targetId of notifyUserIds) {
                        await Notification.create({
                            user: targetId,
                            message: `Internal Note on "${ticket.title}" by ${req.user.name}`,
                            isRead: false
                        });
                        io.to(`user:${targetId}`).emit('notification', {
                            message: `Internal Note on ticket: "${ticket.title}"`
                        });
                    }
                } else {
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
                console.error('Background Notification error (addComment):', e);
            }
        });

        res.json({ message: 'Comment added', ticketId: ticket._id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

export const getStats = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const empId = new mongoose.Types.ObjectId(userId);
        
        const stats = await Ticket.aggregate([
            { $match: { assignedEmployee: empId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "OPEN"] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
                    waitingForClient: { $sum: { $cond: [{ $eq: ["$status", "WAITING_FOR_CLIENT"] }, 1, 0] } },
                    doubtRaised: { $sum: { $cond: [{ $eq: ["$status", "DOUBT_RAISED"] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            pending: 0,
            inProgress: 0,
            waitingForClient: 0,
            doubtRaised: 0,
            resolved: 0
        };

        delete result._id;
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
