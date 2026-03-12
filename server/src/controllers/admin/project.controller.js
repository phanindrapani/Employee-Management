import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Notification from '../../models/notification.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';

export const createProject = async (req, res) => {
    try {
        const { progress, ...projectData } = req.body;
        const project = await Project.create({ ...projectData, progress: 0, createdBy: req.user._id });

        try {
            const io = getIO();
            const populatedProject = await Project.findById(project._id)
                .populate('managerId', 'name email')
                .populate({ path: 'assignedTeams', populate: { path: 'department' } })
                .populate('clientId', 'name company');
            io.to('role:admin').emit('project:created', populatedProject);

            if (project.managerId) {
                io.to(`user:${project.managerId}`).emit('project:created', populatedProject);

                await Notification.create({
                    user: project.managerId,
                    message: `You have been assigned as Manager for Project: "${project.name}"`,
                    isRead: false
                });

                io.to(`user:${project.managerId}`).emit('notification', {
                    message: `New Project Assigned: "${project.name}"`
                });
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('managerId', 'name email')
            .populate({ path: 'assignedTeams', populate: { path: 'department' } })
            .populate('clientId', 'name company')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (e) { res.status(500).json({ msg: "Failed to fetch" }); }
};

export const updateProject = async (req, res) => {
    try {
        const { progress, ...updateData } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });

        try {
            const io = getIO();
            const populatedProject = await Project.findById(req.params.id)
                .populate('managerId', 'name email')
                .populate({ path: 'assignedTeams', populate: { path: 'department' } })
                .populate('clientId', 'name company');
            io.to('role:admin').emit('project:updated', populatedProject);
            if (project.managerId) {
                io.to(`user:${project.managerId}`).emit('project:updated', populatedProject);
            }
            if (project.assignedTeams && project.assignedTeams.length > 0) {
                project.assignedTeams.forEach(teamId => {
                    io.to(`team:${teamId}`).emit('project:updated', populatedProject);
                });
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const updateProjectStatus = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, { status: req.body.status, progress: req.body.progress }, { new: true });

        try {
            const io = getIO();
            const populatedProject = await Project.findById(req.params.id).populate({ path: 'assignedTeams', populate: { path: 'department' } });
            io.to('role:admin').emit('project:updated', populatedProject);
            if (project.assignedTeams && project.assignedTeams.length > 0) {
                project.assignedTeams.forEach(teamId => {
                    io.to(`team:${teamId}`).emit('project:updated', populatedProject);
                });
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(project);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        await Project.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ project: req.params.id });

        try {
            const io = getIO();
            io.to('role:admin').emit('project:deleted', req.params.id);
            if (project && project.assignedTeams && project.assignedTeams.length > 0) {
                project.assignedTeams.forEach(teamId => {
                    io.to(`team:${teamId}`).emit('project:deleted', req.params.id);
                });
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
