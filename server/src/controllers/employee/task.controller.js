import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import { syncProjectProgress } from '../../services/projectProgress.service.js';
// Importing from admin controller as a temporary measure until services are fully separated
import { recalculatePerformanceForUser } from '../admin/performance.controller.js';
import mongoose from 'mongoose';

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
