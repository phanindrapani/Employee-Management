import mongoose from 'mongoose';
import Ticket from '../../models/ticket.model.js';
import User, { Client } from '../../models/user.model.js';
import { getIO } from '../../socket.js';
import Notification from '../../models/notification.model.js';
import Project from '../../models/project.model.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

export const createTicket = async (req, res) => {
    try {
        let { title, description, category, priority, projectId } = req.body;
        let attachments = [];
        if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid Project ID format. Please leave blank if unsure.' });
        }

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = await uploadBufferToCloudinary(file, 'ticket-attachments');
                attachments.push({
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    dataUrl: url
                });
            }
        }

        const ticket = await Ticket.create({
            title,
            description,
            category: category || 'SUPPORT',
            priority: priority || 'MEDIUM',
            projectId: projectId || null,
            clientId: req.user._id,
            attachments
        });

        const io = getIO();
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            user: admin._id,
            message: `New Ticket Raised: "${ticket.title}" by ${req.user.name}`,
            isRead: false
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        io.to('role:admin').emit('notification', {
            message: `New Ticket Raised: "${ticket.title}"`
        });
        io.to('role:admin').emit('ticket:created', ticket);

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: error.message || 'Failed to create ticket' });
    }
};

export const getClientProjects = async (req, res) => {
    try {
        const projects = await Project.find({ clientId: req.user._id })
            .select('name status')
            .sort({ name: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects' });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const { status, priority, category } = req.query;
        const filter = { clientId: req.user.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const tickets = await Ticket.find(filter)
            .populate('projectId', 'name')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name')
            .populate('assignedEmployee', 'name')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, clientId: req.user.id })
            .populate('projectId', 'name')
            .populate('assignedManager', 'name')
            .populate('assignedTeamLead', 'name')
            .populate('assignedEmployee', 'name')
            .populate('comments.userId', 'name role');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const clientView = ticket.toObject();
        clientView.comments = clientView.comments.filter(c => !c.isInternal);

        res.json(clientView);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, clientId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.comments.push({
            userId: req.user.id,
            role: 'client',
            message,
            isInternal: false
        });

        if (['WAITING_FOR_CLIENT', 'DOUBT_RAISED'].includes(ticket.status)) {
            ticket.status = 'IN_PROGRESS';
        }

        await ticket.save();

        try {
            const io = getIO();
            const notifyUserIds = [ticket.assignedEmployee, ticket.assignedTeamLead, ticket.assignedManager].filter(id => id);
            for (const userId of notifyUserIds) {
                await Notification.create({
                    user: userId,
                    message: `Client Replied on "${ticket.title}"`,
                    isRead: false
                });
                io.to(`user:${userId}`).emit('notification', {
                    message: `Client Replied on ticket: "${ticket.title}"`
                });
            }
        } catch (e) {
            console.error('Client comment notification error:', e);
        }

        res.json({ message: 'Comment added', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

export const reopenTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, clientId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            return res.status(400).json({ message: 'Only resolved or closed tickets can be reopened' });
        }

        ticket.status = 'REOPENED';
        ticket.resolvedAt = null;
        ticket.resolutionNote = null;
        ticket.comments.push({
            userId: req.user.id,
            role: 'client',
            message: req.body.reason || 'Client reopened the ticket.',
            isInternal: false
        });

        await ticket.save();
        res.json({ message: 'Ticket reopened', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reopen ticket' });
    }
};

export const getClientStats = async (req, res) => {
    try {
        const clientId = req.user.id;
        const [total, open, inProgress, resolved, closed, slaBreached] = await Promise.all([
            Ticket.countDocuments({ clientId }),
            Ticket.countDocuments({ clientId, status: 'OPEN' }),
            Ticket.countDocuments({ clientId, status: { $in: ['IN_PROGRESS', 'DOUBT_RAISED'] } }),
            Ticket.countDocuments({ clientId, status: 'RESOLVED' }),
            Ticket.countDocuments({ clientId, status: 'CLOSED' }),
            Ticket.countDocuments({ clientId, slaBreached: true, status: { $nin: ['CLOSED'] } })
        ]);
        res.json({ total, open, inProgress, resolved, closed, slaBreached });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
