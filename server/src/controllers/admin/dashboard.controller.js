import User from '../../models/user.model.js';
import Leave from '../../models/leave.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Team from '../../models/team.model.js';
import Ticket from '../../models/ticket.model.js';
import { getGlobalSummary } from '../../services/stats.service.js';

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const summary = await getGlobalSummary(req.user._id);

        const [
            pendingLeaves,
            upcomingDeadlines,
            recentTasks,
            teams,
            recentProjects,
            recentLeaves,
            recentTickets
        ] = await Promise.all([
            Leave.find({ status: 'pending', approver: req.user._id }).populate('user', 'name profilePicture').limit(5).sort({ createdAt: -1 }).lean(),
            Project.find({ status: 'ongoing', endDate: { $gte: today } }).populate('managerId', 'name').sort({ endDate: 1 }).limit(5).lean(),
            Task.find().sort({ createdAt: -1 }).limit(10).populate('assignedTo', 'name').lean(),
            Team.find().populate('teamLead', 'name').lean(),
            Project.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name').lean(),
            Leave.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
            Ticket.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'name').lean()
        ]);

        // Aggregate activities
        const activities = [
            ...recentTasks.map(task => ({
                message: `${task.assignedTo?.name || 'An employee'} was assigned to task "${task.title}"`,
                time: task.createdAt,
                type: 'task'
            })),
            ...recentProjects.map(proj => ({
                message: `New project "${proj.name}" was initiated`,
                time: proj.createdAt,
                type: 'project'
            })),
            ...recentLeaves.map(leave => ({
                message: `${leave.user?.name || 'An employee'} applied for ${leave.leaveType} leave`,
                time: leave.createdAt,
                type: 'leave'
            })),
            ...recentTickets.map(ticket => ({
                message: `New support ticket "${ticket.title}" received from ${ticket.clientId?.name || 'a client'}`,
                time: ticket.createdAt,
                type: 'ticket'
            }))
        ];

        // Sort by time descending and take top 15
        const activityFeed = activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 15);

        const teamPerformance = await Promise.all(teams.map(async team => {
            const projects = await Project.find({ assignedTeams: team._id });
            const avgProgress = projects.length > 0
                ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
                : 0;
            return {
                _id: team._id,
                name: team.name,
                lead: team.teamLead?.name || 'No Lead',
                members: team.members.length,
                activeProjects: projects.filter(p => ['ongoing', 'upcoming'].includes(p.status)).length,
                avgProgress
            };
        }));

        const { monthlyTrend, distribution, ...coreSummary } = summary;

        res.json({
            summary: coreSummary,
            pendingActions: {
                leaves: pendingLeaves,
                deadlines: upcomingDeadlines.map(p => ({
                    _id: p._id,
                    name: p.name,
                    endDate: p.endDate,
                    managerId: p.managerId
                }))
            },
            teamPerformance,
            recentActivity: activityFeed,
            monthlyTrend,
            distribution
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};

export const getReportStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const [
            approvedLeaves,
            monthlyAgg,
            distributionAgg,
            employeeAgg
        ] = await Promise.all([
            Leave.find({ status: 'approved' }),
            Leave.aggregate([
                { $match: { status: 'approved', fromDate: { $gte: startOfYear, $lte: endOfYear } } },
                { $group: { _id: { $month: "$fromDate" }, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } }
            ]),
            Leave.aggregate([
                { $match: { status: 'approved' } },
                {
                    $group: {
                        _id: "$leaveType",
                        requests: { $sum: 1 },
                        days: { $sum: "$totalDays" }
                    }
                }
            ]),
            Leave.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: "$user", leaves: { $sum: 1 }, days: { $sum: "$totalDays" } } },
                { $sort: { days: -1 } },
                { $limit: 5 },
                { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
                { $unwind: "$userInfo" },
                { $project: { name: "$userInfo.name", leaves: 1, days: 1 } }
            ])
        ]);

        const totalLeavesCount = approvedLeaves.length;
        const totalDays = approvedLeaves.reduce((acc, l) => acc + l.totalDays, 0);
        const avgDuration = totalLeavesCount > 0 ? (totalDays / totalLeavesCount).toFixed(1) : 0;
        const mostCommonLeave = distributionAgg.length > 0
            ? distributionAgg.reduce((prev, curr) => (curr.days > prev.days ? curr : prev))
            : null;

        const monthlyData = Array(12).fill(0).map((_, i) => ({
            name: new Date(0, i).toLocaleString('default', { month: 'short' }),
            leaves: monthlyAgg.find(item => item._id === (i + 1))?.count || 0
        }));

        res.json({
            summary: {
                totalLeaves: totalLeavesCount,
                avgDuration,
                mostCommonType: mostCommonLeave?._id || 'N/A',
                utilizationRate: totalLeavesCount > 0 ? ((totalDays / (totalLeavesCount * 24)) * 100).toFixed(1) : 0
            },
            monthlyData,
            employeeStats: employeeAgg,
            leaveDistribution: distributionAgg.map(item => ({ name: item._id, value: item.days }))
        });
    } catch (error) {
        console.error("Report Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch report stats" });
    }
};
