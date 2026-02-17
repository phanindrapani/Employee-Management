import User from '../../models/user.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Leave from '../../models/leave.model.js';
import { getTeamStats, getProductivityTrend } from '../../services/stats.service.js';

export const getTeamDashboardStats = async (req, res) => {
    try {
        const teamId = req.user.team;
        if (!teamId) return res.status(400).json({ message: "No team assigned to this profile" });

        const stats = await getTeamStats(teamId);
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const productivityTrend = await getProductivityTrend(memberIds);
        const avgProductivity = productivityTrend.length > 0
            ? Math.round(productivityTrend.reduce((acc, curr) => acc + curr.efficiency, 0) / productivityTrend.length)
            : 0;

        // Dynamic Alerts
        const alerts = [];

        // Project Deadlines Alert
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        const endingSoon = await Project.countDocuments({
            assignedTeam: teamId,
            status: 'ongoing',
            endDate: { $lte: soon, $gte: new Date() }
        });
        if (endingSoon > 0) alerts.push({ type: 'Project', message: `${endingSoon} projects ending within 7 days`, severity: 'warning' });

        // Leave Alert
        if (stats.onLeaveToday > 0) alerts.push({ type: 'Resource', message: `${stats.onLeaveToday} team members on leave today`, severity: 'info' });

        // Pending Approval Alert
        if (stats.pendingTasks > 0) alerts.push({ type: 'Task', message: `${stats.pendingTasks} tasks require status review`, severity: 'success' });

        res.json({
            ...stats,
            pendingApprovals: stats.pendingTasks,
            weeklyProductivity: avgProductivity,
            productivityTrend: productivityTrend.map(p => ({ day: p.name, value: p.efficiency })),
            alerts
        });
    } catch (error) {
        console.error("Team Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch team stats" });
    }
};
