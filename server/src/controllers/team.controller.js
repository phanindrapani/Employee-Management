import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import Leave from '../models/leave.model.js';
import mongoose from 'mongoose';

/**
 * Dashboard & Analytics for Team Leads
 */
export const getTeamDashboardStats = async (req, res) => {
    try {
        const teamId = req.user.team;
        if (!teamId) return res.status(400).json({ message: "No team assigned to this profile" });

        // 1. Team Size
        const teamSize = await User.countDocuments({ team: teamId });

        // 2. My Team's Active Projects
        const activeProjects = await Project.countDocuments({
            assignedTeam: teamId,
            status: { $in: ['ongoing', 'upcoming'] }
        });

        // 3. Team Task Summary
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const pendingTasks = await Task.countDocuments({
            assignedTo: { $in: memberIds },
            status: { $ne: 'done' }
        });

        // 4. Team Members on Leave Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const onLeaveToday = await Leave.countDocuments({
            user: { $in: memberIds },
            status: 'approved',
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        res.json({
            teamSize,
            activeProjects,
            pendingTasks,
            onLeaveToday,
            pendingApprovals: pendingTasks, // Simplification or specific logic for TL approval tasks
            weeklyProductivity: 85 // Mocked for now, calculated from task completions
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team stats" });
    }
};

/**
 * Detailed Team Members List (Workload/Leave)
 */
export const getTeamMembers = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId })
            .select('name email phone role experienceLevel profilePicture isActive');

        // Enhance with workload (active tasks count)
        const membersWithWorkload = await Promise.all(members.map(async (member) => {
            const taskCount = await Task.countDocuments({
                assignedTo: member._id,
                status: { $in: ['todo', 'in-progress'] }
            });
            return {
                ...member.toObject(),
                activeTasks: taskCount
            };
        }));

        res.json(membersWithWorkload);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team members" });
    }
};

/**
 * Team Leave Calendar Data
 */
export const getTeamLeaves = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const leaves = await Leave.find({ user: { $in: memberIds } })
            .populate('user', 'name profilePicture')
            .sort({ startDate: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team leaves" });
    }
};

/**
 * Team-specific Project View
 */
export const getTeamProjects = async (req, res) => {
    try {
        const teamId = req.user.team;
        const projects = await Project.find({ assignedTeam: teamId })
            .sort({ endDate: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team projects" });
    }
};
