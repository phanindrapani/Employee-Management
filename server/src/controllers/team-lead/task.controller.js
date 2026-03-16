import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import { syncProjectProgress, syncMilestoneProgress } from '../../services/projectProgress.service.js';
import { recalculatePerformanceForUser } from '../admin/performance.controller.js';
import mongoose from 'mongoose';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';

export const createTask = async (req, res) => {
    try {
        const { project: projectId, milestoneId, teamId, title, description, assignedTo, deadline, priority, weight } = req.body;

        const worker = await User.findById(assignedTo).select('team').lean();
        if (!worker) {
            return res.status(404).json({ message: "Assigned user not found" });
        }

        if (worker.team?.toString() !== req.user.team?.toString()) {
            return res.status(403).json({ message: "You can only assign tasks to your own team members" });
        }

        const task = await Task.create({
            project: projectId,
            milestoneId,
            teamId: teamId || req.user.team,
            title,
            description,
            assignedTo,
            assignedBy: req.user._id,
            deadline,
            priority,
            weight
        });

        // Background non-critical tasks
        setImmediate(async () => {
            try {
                await syncProjectProgress(projectId, req.user._id);
                if (milestoneId) {
                    await syncMilestoneProgress(milestoneId);
                }

                const createdTask = await Task.findById(task._id)
                    .populate('project', 'name')
                    .populate('assignedTo', 'name email profilePicture')
                    .lean();

                if (createdTask) {
                    await Notification.create({
                        user: assignedTo,
                        message: `New Task Assigned: "${createdTask.title}" by ${req.user.name}`,
                        isRead: false
                    });

                    const io = getIO();
                    io.to(`user:${assignedTo}`).emit('notification', {
                        message: `New Task Assigned: "${createdTask.title}"`
                    });
                    io.to(`user:${assignedTo}`).emit('task:assigned', createdTask);
                    io.to(`team:${req.user.team}`).emit('task:created', createdTask);
                    io.to('role:admin').emit('task:created', createdTask);
                }
            } catch (err) {
                console.error('Background task error (createTask):', err.message);
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create task" });
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
            .populate('milestoneId', 'name')
            .populate('teamId', 'name')
            .populate('assignedTo', 'name email profilePicture')
            .populate('assignedBy', 'name')
            .populate('comments.user', 'name profilePicture')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team tasks" });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const oldWorkerId = task.assignedTo?.toString();
        const oldWorker = oldWorkerId ? await User.findById(oldWorkerId).select('team role').lean() : null;
        
        if (req.user.role === 'team-lead' && (!oldWorker || oldWorker.team?.toString() !== req.user.team?.toString())) {
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
            status,
            milestoneId,
            teamId
        } = req.body;
        const allowedStatuses = ['todo', 'in-progress', 'review', 'done'];

        let newWorker = oldWorker;
        if (assignedTo && assignedTo.toString() !== oldWorkerId) {
            newWorker = await User.findById(assignedTo).select('team role').lean();
            if (!newWorker) {
                return res.status(404).json({ message: "Assigned user not found" });
            }
            if (req.user.role === 'team-lead' && newWorker.team?.toString() !== req.user.team?.toString()) {
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
        if (milestoneId !== undefined) task.milestoneId = milestoneId;
        if (teamId !== undefined) task.teamId = teamId;

        if (status !== undefined) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }

            if (status === 'done' && task.status !== 'review') {
                return res.status(400).json({ message: "Task must be in review before it can be marked done" });
            }

            if (status === 'done' && task.status !== 'done') {
                task.completedAt = new Date();
            } else if (status !== 'done' && task.status === 'done') {
                task.completedAt = null;
            }
            task.status = status;
        }

        await task.save();

        // Background non-critical tasks
        setImmediate(async () => {
            try {
                // Sync progress for current and potentially previous project
                if (task.project) {
                    await syncProjectProgress(task.project, req.user._id);
                }
                if (project && oldProjectId && project.toString() !== oldProjectId) {
                    await syncProjectProgress(oldProjectId, req.user._id);
                }
                
                if (task.milestoneId) {
                    await syncMilestoneProgress(task.milestoneId);
                }
                if (milestoneId && task.milestoneId && milestoneId.toString() !== task.milestoneId.toString()) {
                    await syncMilestoneProgress(milestoneId);
                }

                const updatedTask = await Task.findById(id)
                    .populate('project', 'name')
                    .populate('assignedTo', 'name email profilePicture')
                    .lean();

                if (!updatedTask) return;

                // Performance recalculation
                if (status !== undefined && newWorker && ['employee', 'team-lead'].includes(newWorker.role)) {
                    const now = new Date();
                    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    try {
                        await recalculatePerformanceForUser(newWorker._id, period);
                    } catch (scoreError) {
                        console.error('Performance recalculation error (TL task update):', scoreError.message);
                    }
                }

                // Sockets and Notifications
                const io = getIO();
                if (oldWorkerId) {
                    io.to(`user:${oldWorkerId}`).emit('task:updated', updatedTask);
                }
                if (assignedTo && assignedTo.toString() !== oldWorkerId) {
                    io.to(`user:${assignedTo}`).emit('task:assigned', updatedTask);
                }
                io.to(`team:${req.user.team}`).emit('task:updated', updatedTask);
                io.to('role:admin').emit('task:updated', updatedTask);

                if (status === 'done' && req.user.role === 'team-lead' && updatedTask.assignedTo) {
                    const assigneeId = updatedTask.assignedTo._id;
                    await Notification.create({
                        user: assigneeId,
                        message: `Task Completed: "${updatedTask.title}" marked as Done by Team Lead`,
                        isRead: false
                    });
                    io.to(`user:${assigneeId}`).emit('notification', {
                        message: `Task Completed: "${updatedTask.title}" marked as Done`
                    });
                }
            } catch (err) {
                console.error('Background task error (updateTask):', err.message);
            }
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update task" });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id).select('assignedTo project milestoneId').lean();
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const worker = task.assignedTo ? await User.findById(task.assignedTo).select('team').lean() : null;
        if (!worker || worker.team?.toString() !== req.user.team?.toString()) {
            return res.status(403).json({ message: "You can only delete tasks for your team members" });
        }

        const projectId = task.project;
        const milestoneId = task.milestoneId;
        await Task.findByIdAndDelete(id);

        // Background non-critical tasks
        setImmediate(async () => {
            try {
                if (projectId) {
                    await syncProjectProgress(projectId, req.user._id);
                }
                if (milestoneId) {
                    await syncMilestoneProgress(milestoneId);
                }

                const io = getIO();
                if (task.assignedTo) {
                    io.to(`user:${task.assignedTo}`).emit('task:deleted', { _id: id });
                }
                io.to(`team:${req.user.team}`).emit('task:deleted', { _id: id });
                io.to('role:admin').emit('task:deleted', { _id: id });
            } catch (err) {
                console.error('Background task error (deleteTask):', err.message);
            }
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete task" });
    }
};
