import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import { overrideProjectProgress, setProgressMode } from '../services/projectProgress.service.js';
import mongoose from 'mongoose';

/**
 * Handle manual progress override (Admin / Team Lead)
 */
export const updateProjectProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, mode } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isTLForTeam = req.user.role === 'team-lead' && project.assignedTeam?.toString() === req.user.team?.toString();

        if (!isAdmin && !isTLForTeam) {
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
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update project progress" });
    }
};
