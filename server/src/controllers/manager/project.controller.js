import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';

export const getManagerProjects = async (req, res) => {
    try {
        const managerId = req.user.id;

        const teams = await Team.find({ manager: managerId }).select('_id').lean();
        const teamIds = teams.map(t => t._id);

        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        })
            .select('projectId name description status priority startDate endDate managerId assignedTeams progress progressMode lastCalculatedAt clientId createdAt updatedAt')
            .populate('assignedTeams', 'name')
            .populate('clientId', 'name company')
            .sort({ updatedAt: -1 })
            .lean();

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch projects" });
    }
};

export const getProjectStats = async (req, res) => {
    try {
        const managerId = req.user.id;

        const teams = await Team.find({ manager: managerId }).select('_id').lean();
        const teamIds = teams.map(t => t._id);

        const stats = await Project.aggregate([
            {
                $match: {
                    $or: [
                        { managerId: new mongoose.Types.ObjectId(managerId) },
                        { assignedTeams: { $in: teamIds } }
                    ]
                }
            },
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
        const teamLeads = await User.find({ role: 'team-lead' }).select('name email').lean();
        res.json(teamLeads);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team leads" });
    }
};

export const createProject = async (req, res) => {
    try {
        const { progress, ...projectData } = req.body;
        const project = await Project.create({ ...projectData, progress: 0, createdBy: req.user._id });

        setImmediate(async () => {
            try {
                const io = getIO();
                const populatedProject = await Project.findById(project._id)
                    .populate({ path: 'assignedTeams', populate: { path: 'department' } })
                    .populate('clientId', 'name company')
                    .lean();

                io.to('role:admin').emit('project:created', populatedProject);
                io.to('role:manager').emit('project:created', populatedProject);

                if (project.assignedTeams && project.assignedTeams.length > 0) {
                    project.assignedTeams.forEach(teamId => {
                        io.to(`team:${teamId}`).emit('project:created', populatedProject);
                    });

                    const teamMembers = await User.find({ team: { $in: project.assignedTeams } }).select('_id').lean();
                    if (teamMembers.length > 0) {
                        const notifications = teamMembers.map(member => ({
                            user: member._id,
                            message: `New Project Assigned: "${project.name}" has been assigned to your team`,
                            isRead: false
                        }));
                        await Notification.insertMany(notifications);

                        project.assignedTeams.forEach(teamId => {
                            io.to(`team:${teamId}`).emit('notification', {
                                message: `New Project Assigned: "${project.name}"`
                            });
                        });
                    }
                }
            } catch (e) {
                console.error('Background task error (createProject):', e.message);
            }
        });

        res.status(201).json(project);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { progress, ...updateData } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();

        setImmediate(async () => {
            try {
                const io = getIO();
                const populatedProject = await Project.findById(req.params.id)
                    .populate('managerId', 'name email')
                    .populate({ path: 'assignedTeams', populate: { path: 'department' } })
                    .populate('clientId', 'name company')
                    .lean();

                io.to('role:admin').emit('project:updated', populatedProject);
                io.to('role:manager').emit('project:updated', populatedProject);

                if (project.assignedTeams && project.assignedTeams.length > 0) {
                    project.assignedTeams.forEach(teamId => {
                        io.to(`team:${teamId}`).emit('project:updated', populatedProject);
                    });
                }
            } catch (e) {
                console.error('Background task error (updateProject):', e.message);
            }
        });

        res.json(project);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).lean();
        if (!project) return res.status(404).json({ message: "Project not found" });

        await Project.findByIdAndDelete(req.params.id);
        
        setImmediate(async () => {
            try {
                await Task.deleteMany({ project: req.params.id });
                const io = getIO();
                io.to('role:admin').emit('project:deleted', req.params.id);
                io.to('role:manager').emit('project:deleted', req.params.id);
                if (project.assignedTeams && project.assignedTeams.length > 0) {
                    project.assignedTeams.forEach(teamId => {
                        io.to(`team:${teamId}`).emit('project:deleted', req.params.id);
                    });
                }
            } catch (e) {
                console.error('Background task error (deleteProject):', e.message);
            }
        });

        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete project" });
    }
};

export const getAllCompanyProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .select('projectId name status priority startDate endDate managerId assignedTeams progress clientId createdAt updatedAt')
            .populate({ path: 'assignedTeams', populate: { path: 'manager', select: 'name' } })
            .populate('clientId', 'name company')
            .sort({ createdAt: -1 })
            .lean();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all projects" });
    }
};
