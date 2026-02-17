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

        // 5. Weekly Productivity Trend (Last 7 Days)
        const productivityTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const completedTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                status: 'done',
                updatedAt: { $gte: date, $lt: nextDay }
            });

            const totalTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                updatedAt: { $gte: date, $lt: nextDay }
            });

            productivityTrend.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            });
        }

        const avgProductivity = productivityTrend.length > 0
            ? Math.round(productivityTrend.reduce((acc, curr) => acc + curr.value, 0) / productivityTrend.length)
            : 0;

        // 6. Dynamic Alerts
        const alerts = [];

        // Project Deadlines Alert
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        const endingSoon = await Project.countDocuments({
            assignedTeam: teamId,
            status: 'ongoing',
            endDate: { $lte: soon, $gte: new Date() }
        });
        if (endingSoon > 0) {
            alerts.push({
                type: 'Project',
                message: `${endingSoon} projects ending within 7 days`,
                severity: 'warning'
            });
        }

        // Leave Alert
        if (onLeaveToday > 0) {
            alerts.push({
                type: 'Resource',
                message: `${onLeaveToday} team members on leave today`,
                severity: 'info'
            });
        }

        // Pending Approval Alert (Using real pending tasks count as a proxy for approvals)
        if (pendingTasks > 0) {
            alerts.push({
                type: 'Task',
                message: `${pendingTasks} tasks require status review`,
                severity: 'success'
            });
        }

        res.json({
            teamSize,
            activeProjects,
            pendingTasks,
            onLeaveToday,
            pendingApprovals: pendingTasks,
            weeklyProductivity: avgProductivity,
            productivityTrend,
            alerts
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

        // Fetch members with workload
        const members = await User.find({ team: teamId })
            .select('name email phone role experienceLevel skills profilePicture isActive');

        // Fetch team metadata for dynamic header
        const teamInfo = await User.findById(req.user._id)
            .populate({
                path: 'team',
                select: 'name'
            })
            .populate({
                path: 'department',
                select: 'name'
            });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const membersEnhanced = await Promise.all(members.map(async (member) => {
            const taskCount = await Task.countDocuments({
                assignedTo: member._id,
                status: { $in: ['todo', 'in-progress'] }
            });

            const isOnLeave = await Leave.exists({
                user: member._id,
                status: 'approved',
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            return {
                ...member.toObject(),
                activeTasks: taskCount,
                isOnLeave: !!isOnLeave
            };
        }));

        res.json({
            members: membersEnhanced,
            metadata: {
                teamName: teamInfo.team?.name || 'My Team',
                departmentName: teamInfo.department?.name || 'Human Resources'
            }
        });
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
            .populate('assignedTeam', 'name')
            .sort({ endDate: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team projects" });
    }
};

/**
 * Advanced Analytics for Team Reports
 */
export const getTeamReports = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id name');
        const memberIds = members.map(m => m._id);

        // 1. Productivity Trend (Last 7 Days)
        const productivityTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const completedTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                status: 'done',
                updatedAt: { $gte: date, $lt: nextDay }
            });

            const totalTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                updatedAt: { $gte: date, $lt: nextDay }
            });

            productivityTrend.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                tasks: completedTasks,
                efficiency: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            });
        }

        // 2. Member Contribution (Total Completed Tasks)
        const contributionData = await Promise.all(members.map(async (member) => {
            const completedCount = await Task.countDocuments({
                assignedTo: member._id,
                status: 'done'
            });
            return {
                name: member.name,
                value: completedCount
            };
        }));

        // Filter out members with 0 contribution to keep chart clean
        const activeContribution = contributionData.filter(d => d.value > 0);

        // 3. Summary Stats (Achievement & Consistency)
        const totalCompleted = activeContribution.reduce((acc, curr) => acc + curr.value, 0);
        const totalPending = await Task.countDocuments({
            assignedTo: { $in: memberIds },
            status: { $ne: 'done' }
        });

        const achievementRate = totalPending + totalCompleted > 0
            ? Math.round((totalCompleted / (totalPending + totalCompleted)) * 100)
            : 0;

        res.json({
            productivityTrend,
            contributionData: activeContribution,
            summary: {
                achievementRate,
                totalCompleted,
                teamSize: members.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate team reports" });
    }
};
