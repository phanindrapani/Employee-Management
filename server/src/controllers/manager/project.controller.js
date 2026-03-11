import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';

export const getManagerProjects = async (req, res) => {
    try {
        const managerId = req.user.id;

        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);

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

export const createProject = async (req, res) => {
    try {
        const { progress, ...projectData } = req.body;
        const project = await Project.create({ ...projectData, progress: 0, createdBy: req.user._id });

        try {
            const io = getIO();
            const populatedProject = await Project.findById(project._id)
                .populate({ path: 'assignedTeam', populate: { path: 'department' } })
                .populate('clientId', 'name company');

            io.to('role:admin').emit('project:created', populatedProject);
            io.to('role:manager').emit('project:created', populatedProject);

            if (project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:created', populatedProject);

                const teamMembers = await User.find({ team: project.assignedTeam });
                if (teamMembers.length > 0) {
                    const notifications = teamMembers.map(member => ({
                        user: member._id,
                        message: `🚀 New Project Assigned: "${project.name}" has been assigned to your team`,
                        isRead: false
                    }));
                    await Notification.insertMany(notifications);

                    io.to(`team:${project.assignedTeam}`).emit('notification', {
                        message: `🚀 New Project Assigned: "${project.name}"`
                    });
                }
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(project);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateProject = async (req, res) => {
    try {
        const { progress, ...updateData } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });

        try {
            const io = getIO();
            const populatedProject = await Project.findById(req.params.id)
                .populate({ path: 'assignedTeam', populate: { path: 'department' } })
                .populate('clientId', 'name company');

            io.to('role:admin').emit('project:updated', populatedProject);
            io.to('role:manager').emit('project:updated', populatedProject);

            if (project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:updated', populatedProject);
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(project);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        await Project.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ project: req.params.id });

        try {
            const io = getIO();
            io.to('role:admin').emit('project:deleted', req.params.id);
            io.to('role:manager').emit('project:deleted', req.params.id);
            if (project && project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:deleted', req.params.id);
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: "Failed" }); }
};

export const getAllCompanyProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate({ path: 'assignedTeam', populate: { path: 'manager', select: 'name' } })
            .populate('clientId', 'name company')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all projects" });
    }
};
