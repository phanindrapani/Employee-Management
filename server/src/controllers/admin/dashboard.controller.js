import User from '../../models/user.model.js';
import Leave from '../../models/leave.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import Team from '../../models/team.model.js';
import { getGlobalSummary } from '../../services/stats.service.js';

// ==================================================
// DASHBOARD STATS (Aggregations)
// ==================================================
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const summary = await getGlobalSummary(req.user._id);

        // Specific items still needed for Admin Dashboard
        const [
            pendingLeaves,
            upcomingDeadlines,
            recentTasks,
            teams
        ] = await Promise.all([
            Leave.find({ status: 'pending', approver: req.user._id }).populate('user', 'name profilePicture').limit(5).sort({ createdAt: -1 }).lean(),
            Project.find({ status: 'ongoing', endDate: { $gte: today } }).populate('assignedTeams', 'name').sort({ endDate: 1 }).limit(5).lean(),
            Task.find().sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name').lean(),
            Team.find().populate('teamLead', 'name').lean()
        ]);

        const activityFeed = recentTasks.map(task => ({
            message: `${task.assignedTo?.name || 'System'} was assigned to "${task.title}"`,
            time: task.createdAt,
            type: 'task'
        }));

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
                    assignedTeams: p.assignedTeams
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
        // Interpret "Common Leave" by total leave days consumed.
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
