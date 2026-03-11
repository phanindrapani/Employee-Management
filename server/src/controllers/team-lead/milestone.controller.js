import Milestone from '../../models/milestone.model.js';
import Project from '../../models/project.model.js';
import { getIO } from '../../socket.js';

export const getProjectMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;
        const teamId = req.user.team;

        // Verify project is assigned to the Team Lead's team
        const project = await Project.findOne({ 
            _id: projectId, 
            assignedTeams: teamId 
        });

        if (!project) {
            return res.status(403).json({ message: "Access denied: Project not assigned to your team" });
        }

        const milestones = await Milestone.find({ projectId }).populate('assignedTeam', 'name');
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllTeamMilestones = async (req, res) => {
    try {
        const teamId = req.user.team;

        // Find all projects assigned to the TL's team
        const projects = await Project.find({ assignedTeams: teamId }).select('_id name');
        const projectIds = projects.map(p => p._id);

        // Find all milestones for these projects
        const milestones = await Milestone.find({ 
            projectId: { $in: projectIds } 
        }).populate('projectId', 'name');

        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMilestoneStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const teamId = req.user.team;

        if (!['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const milestone = await Milestone.findById(id).populate({
            path: 'projectId',
            select: 'assignedTeams name'
        });
        
        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        // Verify that the team lead's team is assigned to the project the milestone belongs to
        const assignedTeamsStr = milestone.projectId.assignedTeams.map(t => t.toString());
        if (!assignedTeamsStr.includes(teamId.toString())) {
             return res.status(403).json({ message: "Access denied: Milestone belongs to a project not assigned to your team" });
        }

        milestone.status = status;
        
        // Auto-update progress based on status
        if (status === 'completed') {
            milestone.progress = 100;
        }

        await milestone.save();

        // Socket Emit
        try {
            const io = getIO();
            io.emit('milestone:updated', milestone);
            
            // Specifically notify relevant teams if needed, but for now global emit for this project
            milestone.projectId.assignedTeams.forEach(team => {
                io.to(`team:${team}`).emit('milestone:updated', milestone);
            });
        } catch (socketErr) {
            console.error('Socket emission failed in updateMilestoneStatus:', socketErr);
        }

        res.json(milestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
