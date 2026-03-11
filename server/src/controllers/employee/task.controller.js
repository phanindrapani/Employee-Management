import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import { syncProjectProgress } from '../../services/projectProgress.service.js';
import { recalculatePerformanceForUser } from '../admin/performance.controller.js';
import mongoose from 'mongoose';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

/**
 * Get tasks assigned to current user
 */
export const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'name')
            .populate('milestoneId', 'name')
            .populate('assignedBy', 'name')
            .sort({ deadline: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your tasks" });
    }
};

/**
 * Update task content (progress, comments, attachments)
 */
export const updateTaskContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, comment } = req.body;

        const task = await Task.findById(id);
        if (!task || task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this task" });
        }

        if (progress !== undefined) {
            task.progress = progress;
        }

        if (comment) {
            const commentText = typeof comment === 'object' ? comment.text : comment;
            if (commentText) {
                task.comments.push({
                    user: req.user._id,
                    text: commentText,
                    createdAt: new Date()
                });
            }
        }

        if (req.file) {
            // Assuming upload middleware is used
            const attachmentUrl = await uploadBufferToCloudinary(req.file, 'task_attachments');
            task.attachments.push({
                name: req.file.originalname,
                url: attachmentUrl,
                uploadedAt: new Date()
            });
        }

        await task.save();
        
        const populatedTask = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('milestoneId', 'name')
            .populate('assignedTo', 'name email profilePicture')
            .populate('assignedBy', 'name')
            .populate('comments.user', 'name profilePicture');

        try {
            const io = getIO();
            const worker = await User.findById(req.user._id);
            if (worker?.team) {
                io.to(`team:${worker.team}`).emit('task:updated', populatedTask);
            }
            if (worker?.reportingManager) {
                io.to(`user:${worker.reportingManager}`).emit('task:updated', populatedTask);
            }
        } catch (err) {
            console.error('Socket emit error (task content update):', err.message);
        }

        res.json(populatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['todo', 'in-progress', 'review', 'done'];

        if (!allowedStatuses.includes(status)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid status value" });
        }

        const task = await Task.findById(id).session(session);
        if (!task) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Task not found" });
        }

        const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
        const worker = task.assignedTo ? await User.findById(task.assignedTo).session(session) : null;
        const isTL = req.user.role === 'team-lead' && worker && worker.team?.toString() === req.user.team?.toString();

        if (!isAssigned && !isTL) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Not authorized to update this task" });
        }

        // Employees can submit work for review, but cannot self-complete tasks.
        if (status === 'done' && req.user.role === 'employee') {
            await session.abortTransaction();
            return res.status(403).json({ message: "Team lead review is required before marking a task done" });
        }

        // Team leads can mark done only after review.
        if (status === 'done' && req.user.role === 'team-lead' && task.status !== 'review') {
            await session.abortTransaction();
            return res.status(400).json({ message: "Task must be in review before it can be marked done" });
        }

        if (status === 'done' && task.status !== 'done') {
            task.completedAt = new Date();
        } else if (status !== 'done' && task.status === 'done') {
            task.completedAt = null;
        }

        task.status = status;
        await task.save({ session });

        // Trigger auto-sync for project
        await syncProjectProgress(task.project, req.user._id, session);
        const shouldRecalculateEmployeeScore = Boolean(
            worker &&
            ['employee', 'team-lead'].includes(worker.role) &&
            task.assignedTo &&
            status !== undefined
        );


        await session.commitTransaction();

        // Run after commit so scoring sees the latest persisted task status.
        if (shouldRecalculateEmployeeScore) {
            const now = new Date();
            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            try {
                const metric = await recalculatePerformanceForUser(task.assignedTo, period);
            } catch (scoreError) {
                console.error("Performance Recalculation Error:", scoreError);
            }
        }

        try {
            const io = getIO();
            const payload = await Task.findById(task._id)
                .populate('project', 'name')
                .populate('assignedTo', 'name email profilePicture');

            if (task.assignedTo) {
                io.to(`user:${task.assignedTo}`).emit('task:updated', payload);
            }
            if (worker?.team) {
                io.to(`team:${worker.team}`).emit('task:updated', payload);
            }
            if (worker?.reportingManager) {
                io.to(`user:${worker.reportingManager}`).emit('task:updated', payload);
            }
            io.to('role:admin').emit('task:updated', payload);

            // --- NOTIFICATION: Task Moved to Review ---
            // Sent to Team Lead/Manager when Employee moves task to 'review'
            if (status === 'review' && req.user.role === 'employee' && worker?.reportingManager) {
                await Notification.create({
                    user: worker.reportingManager,
                    message: `Task submitted for Review: "${task.title}" by ${req.user.name}`,
                    isRead: false
                });

                io.to(`user:${worker.reportingManager}`).emit('notification', {
                    message: `Task submitted for Review: "${task.title}"`
                });
            }
        } catch (socketError) {
            console.error('Socket emit error (task status update):', socketError.message);
        }

        res.json(task);
    } catch (error) {
        await session.abortTransaction();
        console.error("Task Update Error:", error);
        res.status(500).json({ message: error.message || "Failed to update task" });
    } finally {
        session.endSession();
    }
};
