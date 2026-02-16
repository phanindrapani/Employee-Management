import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import { syncProjectProgress } from '../services/projectProgress.service.js';
import { recalculatePerformanceForUser } from './performance.controller.js';
import mongoose from 'mongoose';

/**
 * Assign a new task (Team Lead only)
 */
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
        res.status(201).json(task[0]);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to create task" });
    } finally {
        session.endSession();
    }
};

/**
 * Get all tasks for the Team Lead's team
 */
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

/**
 * Get tasks assigned to current user
 */
export const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'name')
            .sort({ deadline: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your tasks" });
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

        console.log(`[DEBUG][TaskStatus] Task ${task._id} status ${task.status} updated by ${req.user._id} (${req.user.role}). AssignedTo=${task.assignedTo}. Recalc=${shouldRecalculateEmployeeScore}`);

        await session.commitTransaction();

        // Run after commit so scoring sees the latest persisted task status.
        if (shouldRecalculateEmployeeScore) {
            const now = new Date();
            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            try {
                const metric = await recalculatePerformanceForUser(task.assignedTo, period);
                console.log(`[DEBUG][TaskStatus] Recalculated metric user=${task.assignedTo} period=${period} total=${metric?.totalScore} completed=${metric?.tasksCompleted}/${metric?.tasksAssigned} onTime=${metric?.onTimeTasks}`);
            } catch (scoreError) {
                console.error("Performance Recalculation Error:", scoreError);
            }
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

/**
 * Delete task (TL only)
 */
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
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to delete task" });
    } finally {
        session.endSession();
    }
};
