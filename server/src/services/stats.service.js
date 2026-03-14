import User from '../models/user.model.js';
import Team from '../models/team.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import Leave from '../models/leave.model.js';
import Department from '../models/department.model.js';
import Holiday from '../models/holiday.model.js';

export const getGlobalSummary = async (adminId = null) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
        totalEmployees,
        totalTeams,
        totalDepartments,
        projectAgg,
        leaveAgg,
        monthlyTrendAgg,
        distributionAgg,
        holidayStats
    ] = await Promise.all([
        User.countDocuments({ role: { $ne: 'admin' } }),
        Team.countDocuments(),
        Department.countDocuments(),
        Project.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    upcoming: { $sum: { $cond: [{ $eq: ["$status", "upcoming"] }, 1, 0] } },
                    ongoing: { $sum: { $cond: [{ $eq: ["$status", "ongoing"] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    onHold: { $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] } }
                }
            }
        ]),
        Leave.aggregate([
            {
                $match: adminId ? { approver: adminId } : {}
            },
            {
                $facet: {
                    pending: [{ $match: { status: 'pending' } }, { $count: "count" }],
                    approvedThisMonth: [
                        { $match: { status: 'approved', updatedAt: { $gte: startOfMonth } } },
                        { $count: "count" }
                    ],
                    rejectedThisMonth: [
                        { $match: { status: 'rejected', updatedAt: { $gte: startOfMonth } } },
                        { $count: "count" }
                    ]
                }
            }
        ]),
        Leave.aggregate([
            {
                $match: {
                    fromDate: { $gte: new Date(today.getFullYear(), 0, 1) },
                    status: 'approved'
                }
            },
            { $group: { _id: { $month: "$fromDate" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]),
        Leave.aggregate([
            { $group: { _id: "$leaveType", value: { $sum: 1 } } },
            { $project: { label: "$_id", value: 1, _id: 0 } }
        ]),
        Holiday.aggregate([
            {
                $facet: {
                    upcoming: [
                        { $match: { date: { $gte: today } } },
                        { $sort: { date: 1 } },
                        { $limit: 1 }
                    ],
                    total: [
                        { $match: { date: { $gte: new Date(today.getFullYear(), 0, 1) } } },
                        { $count: "count" }
                    ]
                }
            }
        ])
    ]);

    const monthlyTrend = Array(12).fill(0);
    monthlyTrendAgg.forEach(item => {
        monthlyTrend[item._id - 1] = item.count;
    });

    return {
        employees: totalEmployees,
        teams: totalTeams,
        departments: totalDepartments,
        projects: projectAgg[0] || { total: 0, upcoming: 0, ongoing: 0, completed: 0, onHold: 0 },
        leaves: {
            pending: leaveAgg[0].pending[0]?.count || 0,
            approvedThisMonth: leaveAgg[0].approvedThisMonth[0]?.count || 0,
            rejectedThisMonth: leaveAgg[0].rejectedThisMonth[0]?.count || 0
        },
        holidays: {
            upcoming: holidayStats[0].upcoming[0] || null,
            total: holidayStats[0].total[0]?.count || 0
        },
        monthlyTrend,
        distribution: distributionAgg
    };
};

export const getTeamStats = async (teamId) => {
    if (!teamId) return null;

    const members = await User.find({ team: teamId }).select('_id');
    const memberIds = members.map(m => m._id);

    const [
        teamSize,
        activeProjects,
        pendingTasks,
        onLeaveCount
    ] = await Promise.all([
        User.countDocuments({ team: teamId }),
        Project.countDocuments({
            assignedTeams: teamId,
            status: { $in: ['ongoing', 'upcoming'] }
        }),
        Task.countDocuments({
            assignedTo: { $in: memberIds },
            status: { $ne: 'done' }
        }),
        Leave.countDocuments({
            user: { $in: memberIds },
            status: 'approved',
            fromDate: { $lte: new Date() },
            toDate: { $gte: new Date() }
        })
    ]);

    return {
        teamSize,
        activeProjects,
        pendingTasks,
        onLeaveToday: onLeaveCount
    };
};

export const getProductivityTrend = async (memberIds, days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const query = memberIds ? { assignedTo: { $in: memberIds } } : {};

    const statsAgg = await Task.aggregate([
        {
            $match: {
                ...query,
                $or: [
                    { createdAt: { $lt: new Date() } },
                    { updatedAt: { $gte: startDate } }
                ]
            }
        },
        {
            $facet: {
                completed: [
                    {
                        $match: {
                            status: 'done',
                            updatedAt: { $gte: startDate }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                            count: { $sum: 1 }
                        }
                    }
                ],
                totalHistorical: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const productivityTrend = [];
    const completedMap = {};
    statsAgg[0].completed.forEach(item => {
        completedMap[item._id] = item.count;
    });

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateString = localDate.toISOString().split('T')[0];

        const completedTasksToday = completedMap[dateString] || 0;

        const totalTeamTasks = statsAgg[0].totalHistorical[0]?.total || 0;

        productivityTrend.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateString,
            tasks: completedTasksToday,
            efficiency: totalTeamTasks > 0 ? Math.round((completedTasksToday / totalTeamTasks) * 100) : 0
        });
    }
    return productivityTrend;
};
