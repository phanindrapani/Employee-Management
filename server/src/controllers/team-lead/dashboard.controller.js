import User from '../../models/user.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Leave from '../../models/leave.model.js';
import Holiday from '../../models/holiday.model.js';
import { getTeamStats, getProductivityTrend } from '../../services/stats.service.js';

export const getTeamDashboardStats = async (req, res) => {
    try {
        const teamId = req.user.team;
        if (!teamId) return res.status(400).json({ message: "No team assigned to this profile" });

        const stats = await getTeamStats(teamId);
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const productivityTrend = await getProductivityTrend(memberIds);

        // Fetch holidays to exclude them from the average calculation
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 7);
        const holidays = await Holiday.find({
            date: { $gte: start, $lte: now }
        });
        const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));

        // Filter out Sundays and Holidays from the average unless there was productivity on those days
        const activeDays = productivityTrend.filter(p => {
            const date = new Date(p.date);
            const isSunday = date.getDay() === 0;
            const isHoliday = holidayDates.has(date.toDateString());
            // Include day if there was work OR if it's a regular working day
            return p.efficiency > 0 || (!isSunday && !isHoliday);
        });

        const avgProductivity = activeDays.length > 0
            ? Math.round(activeDays.reduce((acc, curr) => acc + curr.efficiency, 0) / activeDays.length)
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
