import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import { syncProjectProgress } from '../../services/projectProgress.service.js';
import { recalculatePerformanceForUser } from '../admin/performance.controller.js';
import mongoose from 'mongoose';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import { debounceBackgroundTask } from '../../utils/backgroundTasks.js';

export const getMyTasks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'name')
            .populate('milestoneId', 'name milestoneId')
            .populate('assignedBy', 'name')
            .sort({ deadline: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Task.countDocuments({ assignedTo: req.user._id });

        res.json({
            tasks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your tasks" });
    }
};

export const updateTaskContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, comment } = req.body;

        const update = {};
        if (progress !== undefined) update.progress = progress;

        const query = { _id: id, assignedTo: req.user._id };

        if (comment) {
            const commentText = typeof comment === 'object' ? comment.text : comment;
            if (commentText) {
                update.$push = {
                    comments: {
                        user: req.user._id,
                        text: commentText,
                        createdAt: new Date()
                    }
                };
            }
        }

        if (req.file) {
            const attachmentUrl = await uploadBufferToCloudinary(req.file, 'task_attachments');
            const attachment = {
                name: req.file.originalname,
                url: attachmentUrl,
                uploadedAt: new Date()
            };
            if (update.$push) {
                update.$push.attachments = attachment;
            } else {
                update.$push = { attachments: attachment };
            }
        }

        const updatedTask = await Task.findOneAndUpdate(query, update, { new: true })
            .populate('project', 'name')
            .populate('milestoneId', 'name')
            .populate('assignedBy', 'name')
            .lean();

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found or Not authorized" });
        }

        res.json(updatedTask);

        setImmediate(async () => {
            try {
                const populatedTask = await Task.findById(id)
                    .populate('project', 'name')
                    .populate('milestoneId', 'name')
                    .populate('assignedTo', 'name email profilePicture team reportingManager')
                    .populate('assignedBy', 'name')
                    .populate('comments.user', 'name profilePicture')
                    .lean();

                const io = getIO();
                const worker = populatedTask.assignedTo;
                if (worker?.team) {
                    io.to(`team:${worker.team}`).emit('task:updated', populatedTask);
                }
                if (worker?.reportingManager) {
                    io.to(`user:${worker.reportingManager}`).emit('task:updated', populatedTask);
                }
            } catch (err) {
                console.error('Background task error (task content update):', err.message);
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['todo', 'in-progress', 'review', 'done'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const update = { status };
        if (status === 'done') {
            update.completedAt = new Date();
        } else {
            update.completedAt = null;
        }

        const query = { _id: id };

        if (req.user.role === 'employee') {
            query.assignedTo = req.user._id;
        } else if (req.user.role === 'team-lead') {
            query.$or = [
                { assignedTo: req.user._id },
                { teamId: req.user.team }
            ];
        }

        const updatedTask = await Task.findOneAndUpdate(query, update, { new: true })
            .populate('project', 'name')
            .populate('milestoneId', 'name')
            .populate('assignedBy', 'name')
            .populate('assignedTo', 'team role reportingManager name')
            .lean();

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found or Not authorized" });
        }

        if (status === 'done' && req.user.role === 'employee') {
            await Task.updateOne({ _id: id }, { status: 'review', completedAt: null });
            return res.status(403).json({ message: "Team lead review is required" });
        }

        const backgroundPostProcessing = async () => {
            try {
                const worker = updatedTask.assignedTo;

                debounceBackgroundTask(`projectSync:${updatedTask.project}`, () =>
                    syncProjectProgress(updatedTask.project, req.user._id)
                    , 5000);

                if (worker && ['employee', 'team-lead'].includes(worker.role)) {
                    const now = new Date();
                    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    debounceBackgroundTask(`perfRecalc:${worker._id}:${period}`, () =>
                        recalculatePerformanceForUser(worker._id, period)
                        , 10000);
                }

                const io = getIO();
                const socketPayload = { ...updatedTask };

                if (updatedTask.assignedTo) io.to(`user:${updatedTask.assignedTo._id}`).emit('task:updated', socketPayload);
                if (worker?.team) io.to(`team:${worker.team}`).emit('task:updated', socketPayload);
                if (worker?.reportingManager) io.to(`user:${worker.reportingManager}`).emit('task:updated', socketPayload);
                io.to('role:admin').emit('task:updated', socketPayload);

                if (status === 'review' && req.user.role === 'employee' && worker?.reportingManager) {
                    Notification.create({
                        user: worker.reportingManager,
                        message: `Task submitted for Review: "${updatedTask.title}" by ${req.user.name}`,
                        isRead: false
                    }).then(() => {
                        io.to(`user:${worker.reportingManager}`).emit('notification', { message: `Task submitted for Review` });
                    }).catch(() => { });
                }
            } catch (bgErr) { /* Silent background fail */ }
        };

        backgroundPostProcessing();

        res.json(updatedTask);

    } catch (error) {
        console.error("Extreme Performance Task Update Error:", error);
        res.status(500).json({ message: "Failed to update task" });
    }
};
