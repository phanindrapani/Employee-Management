import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';

/**
 * Assign a new task (Team Lead only)
 */
export const createTask = async (req, res) => {
    try {
        const { project, title, description, assignedTo, deadline, priority } = req.body;

        // Security check: Ensure the assigned user belongs to the same team as the Team Lead
        const worker = await User.findById(assignedTo);
        if (!worker) return res.status(404).json({ message: "Assigned user not found" });

        if (worker.team?.toString() !== req.user.team?.toString()) {
            return res.status(403).json({ message: "You can only assign tasks to your own team members" });
        }

        const task = await Task.create({
            project,
            title,
            description,
            assignedTo,
            deadline,
            priority
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create task" });
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
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // Security: Only assigned user or their TL can update
        const isAssigned = task.assignedTo.toString() === req.user._id.toString();
        const isTL = req.user.role === 'team-lead' && (await User.findById(task.assignedTo)).team?.toString() === req.user.team?.toString();

        if (!isAssigned && !isTL) {
            return res.status(403).json({ message: "Not authorized to update this task" });
        }

        task.status = status;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Failed to update task" });
    }
};

/**
 * Delete task (TL only)
 */
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // Security check
        const worker = await User.findById(task.assignedTo);
        if (worker.team?.toString() !== req.user.team?.toString()) {
            return res.status(403).json({ message: "You can only delete tasks for your team members" });
        }

        await Task.findByIdAndDelete(id);
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete task" });
    }
};
