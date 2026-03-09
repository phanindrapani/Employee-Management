import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';

export const getManagerTaskStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);

        const projects = await Project.find({ assignedTeam: { $in: teamIds } });
        const projectIds = projects.map(p => p._id);

        const stats = await Task.aggregate([
            { $match: { project: { $in: projectIds } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch task stats" });
    }
};

export const getManagerOverdueTasks = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);
        const projects = await Project.find({ assignedTeam: { $in: teamIds } });
        const projectIds = projects.map(p => p._id);

        const now = new Date();
        const overdueTasks = await Task.find({
            project: { $in: projectIds },
            status: { $ne: 'done' },
            deadline: { $lt: now }
        }).populate('assignedTo', 'name email').populate('project', 'name');

        res.json(overdueTasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue tasks" });
    }
};
