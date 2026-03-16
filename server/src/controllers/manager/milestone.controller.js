import Milestone from '../../models/milestone.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';

export const createMilestone = async (req, res) => {
    try {
        const { name, milestoneId, projectId, assignedTeam, dueDate } = req.body;

        const project = await Project.findOne({ _id: projectId, managerId: req.user._id });
        if (!project) {
            return res.status(403).json({ message: "Not authorized to create milestone for this project" });
        }

        const milestone = await Milestone.create({
            name,
            milestoneId,
            projectId,
            assignedTeam,
            dueDate
        });

        if (assignedTeam && !project.assignedTeams.includes(assignedTeam)) {
            project.assignedTeams.push(assignedTeam);
            await project.save();
        }

        if (assignedTeam) {
            // Find Team Lead
            // (Assuming Team model has teamLead)
        }

        res.status(201).json(milestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findOne({ _id: projectId, managerId: req.user._id });
        if (!project) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const milestones = await Milestone.find({ projectId })
            .populate('assignedTeam', 'name')
            .select('name milestoneId projectId assignedTeam dueDate status progress createdAt')
            .lean();
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const milestone = await Milestone.findById(id).populate('projectId');

        if (!milestone || milestone.projectId.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updatedMilestone = await Milestone.findByIdAndUpdate(id, req.body, { new: true });

        if (req.body.status === 'completed' && updatedMilestone.completedAt) {
            const { recalculatePerformanceForUser } = await import('../controllers/admin/performance.controller.js');
            setImmediate(() => recalculatePerformanceForUser(req.user._id, `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`));
        }

        res.json(updatedMilestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const milestone = await Milestone.findById(id).populate('projectId');

        if (!milestone || milestone.projectId.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const taskCount = await Task.countDocuments({ milestoneId: id });
        if (taskCount > 0) {
            return res.status(400).json({ message: "Cannot delete milestone with existing tasks" });
        }

        await Milestone.findByIdAndDelete(id);
        res.json({ message: "Milestone deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findOne({ _id: projectId, managerId: req.user._id });
        if (!project) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const tasks = await Task.find({ project: projectId })
            .select('taskId title status progress priority deadline assignedTo teamId milestoneId')
            .populate('assignedTo', 'name email')
            .populate('teamId', 'name')
            .populate('milestoneId', 'name')
            .lean();

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
