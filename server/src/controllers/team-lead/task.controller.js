import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import { syncProjectProgress } from '../../services/projectProgress.service.js';
import { recalculatePerformanceForUser } from '../admin/performance.controller.js';
import mongoose from 'mongoose';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';

export const createTask = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { project: projectId, title, description, assignedTo, deadline, priority, weight } = req.body;

        const worker = await User.findById(assignedTo).session(session);
        if (!worker) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Assigned user not found" });
        }

        if (worker.team?.toString() !== req.user.team?.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You can only assign tasks to your own team members" });
        }

        const task = await Task.create([{
            project: projectId,
            title,
            description,
            assignedTo,
            deadline,
            priority,
            weight
        }], { session });

        // Trigger auto-sync for project
        await syncProjectProgress(projectId, req.user._id, session);

        await session.commitTransaction();
        const createdTask = await Task.findById(task[0]._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email profilePicture');

        try {
            const io = getIO();

            // --- NOTIFICATION: Task Assigned ---
            await Notification.create({
                user: assignedTo,
                message: `📝 New Task Assigned: "${createdTask.title}" by ${req.user.name}`,
                isRead: false
            });

            io.to(`user:${assignedTo}`).emit('notification', {
                message: `📝 New Task Assigned: "${createdTask.title}"`
            });

            io.to(`user:${assignedTo}`).emit('task:assigned', createdTask);
            io.to(`team:${req.user.team}`).emit('task:created', createdTask);
            io.to('role:admin').emit('task:created', createdTask);
        } catch (socketError) {
            console.error('Socket emit error (task create):', socketError.message);
        }

        res.status(201).json(createdTask);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to create task" });
    } finally {
        session.endSession();
    }
};

export const getTeamTasks = async (req, res) => {
    try {
        const teamId = req.user.team;
        if (!teamId) return res.status(400).json({ message: "You are not assigned to any team" });

        // Find all users in this team
        const teamMembers = await User.find({ team: teamId }).select('_id');
        const memberIds = teamMembers.map(m => m._id);

        const tasks = await Task.find({ assignedTo: { $in: memberIds } })
            .populate('project', 'name')
            .populate('assignedTo', 'name email profilePicture')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team tasks" });
    }
};

export const updateTask = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const task = await Task.findById(id).session(session);
        if (!task) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Task not found" });
        }

        const oldWorker = task.assignedTo ? await User.findById(task.assignedTo).session(session) : null;
        if (req.user.role === 'team-lead' && (!oldWorker || oldWorker.team?.toString() !== req.user.team?.toString())) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You can only update tasks for your team members" });
        }

        const {
            title,
            description,
            project,
            assignedTo,
            deadline,
            priority,
            weight,
            status
        } = req.body;
        const allowedStatuses = ['todo', 'in-progress', 'review', 'done'];

        let newWorker = oldWorker;
        if (assignedTo && assignedTo.toString() !== task.assignedTo?.toString()) {
            newWorker = await User.findById(assignedTo).session(session);
            if (!newWorker) {
                await session.abortTransaction();
                return res.status(404).json({ message: "Assigned user not found" });
            }
            if (req.user.role === 'team-lead' && newWorker.team?.toString() !== req.user.team?.toString()) {
                await session.abortTransaction();
                return res.status(403).json({ message: "You can only assign tasks to your own team members" });
            }
            task.assignedTo = assignedTo;
        }

        const oldProjectId = task.project?.toString();

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (project !== undefined) task.project = project;
        if (deadline !== undefined) task.deadline = deadline;
        if (priority !== undefined) task.priority = priority;
        if (weight !== undefined) task.weight = weight;

        if (status !== undefined) {
            if (!allowedStatuses.includes(status)) {
                await session.abortTransaction();
                return res.status(400).json({ message: "Invalid status value" });
            }

            if (status === 'done' && task.status !== 'review') {
                await session.abortTransaction();
                return res.status(400).json({ message: "Task must be in review before it can be marked done" });
            }

            if (status === 'done' && task.status !== 'done') {
                task.completedAt = new Date();
            } else if (status !== 'done' && task.status === 'done') {
                task.completedAt = null;
            }
            task.status = status;
        }

        await task.save({ session });

        // Keep project progress in sync for updated task/project.
        await syncProjectProgress(task.project, req.user._id, session);
        if (project && oldProjectId && project.toString() !== oldProjectId) {
            await syncProjectProgress(oldProjectId, req.user._id, session);
        }

        await session.commitTransaction();
        const updatedTask = await Task.findById(id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email profilePicture');

        // Recalculate performance score for the assigned employee when any status change occurs
        if (status !== undefined && newWorker && ['employee', 'team-lead'].includes(newWorker.role)) {
            const now = new Date();
            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            try {
                await recalculatePerformanceForUser(newWorker._id, period);
            } catch (scoreError) {
                console.error('Performance recalculation error (TL task update):', scoreError.message);
            }
        }

        try {
            const io = getIO();
            if (oldWorker?._id) {
                io.to(`user:${oldWorker._id}`).emit('task:updated', updatedTask);
            }
            if (newWorker?._id && String(newWorker._id) !== String(oldWorker?._id)) {
                io.to(`user:${newWorker._id}`).emit('task:assigned', updatedTask);
            }
            io.to(`team:${req.user.team}`).emit('task:updated', updatedTask);
            io.to('role:admin').emit('task:updated', updatedTask);

            // --- NOTIFICATION: Task Completed by Lead ---
            // Triggers if status changed to 'done' AND updater is Team Lead
            if (status === 'done' && req.user.role === 'team-lead' && updatedTask.assignedTo) {
                const assigneeId = updatedTask.assignedTo._id;
                await Notification.create({
                    user: assigneeId,
                    message: `✅ Task Completed: "${updatedTask.title}" marked as Done by Team Lead`,
                    isRead: false
                });
                io.to(`user:${assigneeId}`).emit('notification', {
                    message: `✅ Task Completed: "${updatedTask.title}" marked as Done`
                });
            }
        } catch (socketError) {
            console.error('Socket emit error (task update):', socketError.message);
        }

        res.json(updatedTask);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to update task" });
    } finally {
        session.endSession();
    }
};

export const deleteTask = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const task = await Task.findById(id).session(session);
        if (!task) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Task not found" });
        }

        const worker = await User.findById(task.assignedTo).session(session);
        if (!worker || worker.team?.toString() !== req.user.team?.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You can only delete tasks for your team members" });
        }

        const projectId = task.project;
        await Task.findByIdAndDelete(id).session(session);

        // Trigger auto-sync for project
        await syncProjectProgress(projectId, req.user._id, session);

        await session.commitTransaction();
        try {
            const io = getIO();
            if (task.assignedTo) {
                io.to(`user:${task.assignedTo}`).emit('task:deleted', { _id: id });
            }
            io.to(`team:${req.user.team}`).emit('task:deleted', { _id: id });
            io.to('role:admin').emit('task:deleted', { _id: id });
        } catch (socketError) {
            console.error('Socket emit error (task delete):', socketError.message);
        }
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to delete task" });
    } finally {
        session.endSession();
    }
};
