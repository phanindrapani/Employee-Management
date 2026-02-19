import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Notification from '../../models/notification.model.js';
import User from '../../models/user.model.js';
import { getIO } from '../../socket.js';

// ==================================================
// PROJECT MANAGEMENT
// ==================================================
export const createProject = async (req, res) => {
    try {
        // Enforce progress: 0 on creation
        const { progress, ...projectData } = req.body;
        const project = await Project.create({ ...projectData, progress: 0, createdBy: req.user._id });

        // Socket Emit
        try {
            const io = getIO();
            const populatedProject = await Project.findById(project._id).populate({ path: 'assignedTeam', populate: { path: 'department' } });
            io.to('role:admin').emit('project:created', populatedProject);
            if (project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:created', populatedProject);

                // --- NOTIFICATION: Project Assigned ---
                const teamMembers = await User.find({ team: project.assignedTeam });
                if (teamMembers.length > 0) {
                    const notifications = teamMembers.map(member => ({
                        user: member._id,
                        message: `🚀 New Project Assigned: "${project.name}" has been assigned to your team`,
                        isRead: false
                    }));
                    await Notification.insertMany(notifications);

                    // Send individual alerts or team alert
                    // Since we already emit 'project:created' to team room, we can also emit proper 'notification' event
                    // or rely on frontend to catch 'project:created' if we want.
                    // But for consistency with bell icon, we emit 'notification' to the team room
                    io.to(`team:${project.assignedTeam}`).emit('notification', {
                        message: `🚀 New Project Assigned: "${project.name}"`
                    });
                }
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate({ path: 'assignedTeam', populate: { path: 'department' } }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (e) { res.status(500).json({ msg: "Failed to fetch" }); }
};

export const updateProject = async (req, res) => {
    try {
        // Prevent manual progress update by Admin. Progress is driven by tasks.
        const { progress, ...updateData } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // Socket Emit
        try {
            const io = getIO();
            const populatedProject = await Project.findById(req.params.id).populate({ path: 'assignedTeam', populate: { path: 'department' } });
            io.to('role:admin').emit('project:updated', populatedProject);
            if (project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:updated', populatedProject);
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const updateProjectStatus = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, { status: req.body.status, progress: req.body.progress }, { new: true });

        // Socket Emit
        try {
            const io = getIO();
            const populatedProject = await Project.findById(req.params.id).populate({ path: 'assignedTeam', populate: { path: 'department' } });
            io.to('role:admin').emit('project:updated', populatedProject);
            if (project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:updated', populatedProject);
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(project);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id); // Get project before delete to know team
        await Project.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ project: req.params.id });

        // Socket Emit
        try {
            const io = getIO();
            io.to('role:admin').emit('project:deleted', req.params.id);
            if (project && project.assignedTeam) {
                io.to(`team:${project.assignedTeam}`).emit('project:deleted', req.params.id);
            }
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
