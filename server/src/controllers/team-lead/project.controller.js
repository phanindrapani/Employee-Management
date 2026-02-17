import Project from '../../models/project.model.js';
import { overrideProjectProgress, setProgressMode } from '../../services/projectProgress.service.js';
import { getIO } from '../../socket.js';

export const getTeamProjects = async (req, res) => {
    try {
        const teamId = req.user.team;
        const projects = await Project.find({ assignedTeam: teamId })
            .populate('assignedTeam', 'name')
            .sort({ endDate: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team projects" });
    }
};

export const updateProjectProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, mode } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Authorization check
        const isTLForTeam = req.user.role === 'team-lead' && project.assignedTeam?.toString() === req.user.team?.toString();

        if (!isTLForTeam) {
            return res.status(403).json({ message: "Not authorized to override progress for this project" });
        }

        if (mode === 'manual' && typeof progress === 'number') {
            await overrideProjectProgress(id, progress, req.user._id);
        } else if (mode === 'auto') {
            await setProgressMode(id, 'auto', req.user._id);
        } else {
            return res.status(400).json({ message: "Invalid progress override parameters" });
        }

        const updatedProject = await Project.findById(id).populate('assignedTeam', 'name');
        try {
            const io = getIO();
            io.to(`team:${updatedProject.assignedTeam?._id || updatedProject.assignedTeam}`).emit('project:updated', updatedProject);
            io.to('role:admin').emit('project:updated', updatedProject);
        } catch (socketError) {
            console.error('Socket emit error (project progress update):', socketError.message);
        }
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update project progress" });
    }
};
