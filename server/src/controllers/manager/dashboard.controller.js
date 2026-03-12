import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import User from '../../models/user.model.js';
import Ticket from '../../models/ticket.model.js';
import Leave from '../../models/leave.model.js';

export const getManagerDashboardStats = async (req, res) => {
    try {
        const managerId = req.user._id;
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const endOfToday = new Date(now.setHours(23, 59, 59, 999));
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const teams = await Team.find({ manager: managerId }).populate('members', 'name');
        const teamIds = teams.map(t => t._id);
        const memberIds = teams.flatMap(t => t.members.map(m => m._id));

        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        }).populate('assignedTeams', 'name');
        const projectIds = projects.map(p => p._id);

        const [taskStats, ticketStats, employeeCount] = await Promise.all([
            Task.aggregate([
                { $match: { project: { $in: projectIds } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        overdue: {
                            $sum: {
                                $cond: [{ $and: [{ $lt: ["$deadline", new Date()] }, { $ne: ["$status", "done"] }] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            Ticket.aggregate([
                { $match: { projectId: { $in: projectIds } } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),
            User.countDocuments({ _id: { $in: memberIds } })
        ]);

        const openTicketsCount = ticketStats
            .filter(s => s._id === 'OPEN' || s._id === 'ASSIGNED' || s._id === 'REOPENED')
            .reduce((acc, curr) => acc + curr.count, 0);

        const summaryKPIs = {
            teams: teams.length,
            projects: projects.length,
            employees: employeeCount,
            tasks: taskStats[0]?.total || 0,
            tickets: openTicketsCount,
            overdue: taskStats[0]?.overdue || 0
        };

        const projectHealth = projects.map(p => {
            let health = 'Good';
            if (p.progress < 30 && p.status === 'ongoing') health = 'Delayed';
            else if (p.progress < 60 && p.status === 'ongoing') health = 'At Risk';

            return {
                name: p.name,
                team: p.assignedTeams?.[0]?.name || 'Internal',
                progress: p.progress,
                status: health,
                systemStatus: p.status
            };
        });
        const ticketPulse = {
            open: openTicketsCount,
            waiting: ticketStats.find(s => s._id === 'WAITING_FOR_CLIENT' || s._id === 'DOUBT_RAISED')?.count || 0,
            inProgress: ticketStats.find(s => s._id === 'IN_PROGRESS')?.count || 0,
            resolvedToday: await Ticket.countDocuments({
                projectId: { $in: projectIds },
                status: 'RESOLVED',
                updatedAt: { $gte: startOfToday }
            })
        };

        const leaveStats = {
            onLeaveToday: await Leave.countDocuments({
                user: { $in: memberIds },
                status: 'approved',
                startDate: { $lte: endOfToday },
                endDate: { $gte: startOfToday }
            }),
            upcomingLeave: await Leave.countDocuments({
                user: { $in: memberIds },
                status: 'approved',
                startDate: { $gt: endOfToday, $lte: next7Days }
            })
        };

        const alerts = [];
        if (summaryKPIs.overdue > 0) alerts.push({ type: 'danger', message: `${summaryKPIs.overdue} Tasks are currently overdue across all teams.` });
        if (ticketPulse.open > 10) alerts.push({ type: 'warning', message: `High volume of open tickets (${ticketPulse.open}) requiring attention.` });
        projectHealth.filter(p => p.status === 'Delayed').forEach(p => {
            alerts.push({ type: 'danger', message: `Project "${p.name}" is significantly delayed.` });
        });

        const recentActivity = await Task.find({ project: { $in: projectIds } })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('assignedTo', 'name')
            .select('title status updatedAt assignedTo');

        res.json({
            summaryKPIs,
            projectHealth,
            ticketPulse,
            leaveStats,
            alerts,
            recentActivity
        });
    } catch (error) {
        console.error('Error in Manager Dashboard Stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
