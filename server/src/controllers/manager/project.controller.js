import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import User from '../../models/user.model.js';

export const getManagerProjects = async (req, res) => {
    try {
        const managerId = req.user.id;

        // 1. Find all teams managed by this user
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);

        // 2. Find all projects assigned to these teams
        const projects = await Project.find({ assignedTeam: { $in: teamIds } })
            .populate('assignedTeam', 'name')
            .sort({ updatedAt: -1 });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch projects" });
    }
};

export const getProjectStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);

        const stats = await Project.aggregate([
            { $match: { assignedTeam: { $in: teamIds } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch project stats" });
    }
};

export const getTeamLeads = async (req, res) => {
    try {
        const teamLeads = await User.find({ role: 'team-lead' }).select('name email');
        res.json(teamLeads);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team leads" });
    }
};
