import Project from '../../models/project.model.js';

export const getMyTeamProjects = async (req, res) => {
    try {
        const teamId = req.user.team;
        if (!teamId) return res.json([]);

        const projects = await Project.find({ assignedTeam: teamId })
            .populate('assignedTeam', 'name')
            .sort({ endDate: 1 });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects' });
    }
};

