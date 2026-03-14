import mongoose from 'mongoose';
import WorksheetEntry from '../../models/worksheetEntry.model.js';

const PRODUCTIVE_CATEGORIES = ['development', 'design', 'testing', 'documentation', 'research'];

const getAnalysisAggregation = (matchQuery) => [
    { $match: matchQuery },
    {
        $addFields: {
            durationMinutesVal: { $ifNull: ["$durationMinutes", 0] },
            isCompleted: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            isProductive: { $cond: [{ $in: ["$category", PRODUCTIVE_CATEGORIES] }, 1, 0] }
        }
    },
    {
        $facet: {
            summary: [
                {
                    $group: {
                        _id: null,
                        totalMinutes: { $sum: "$durationMinutesVal" },
                        tasksCompletedCount: { $sum: "$isCompleted" },
                        productiveMinutes: { $sum: { $cond: ["$isProductive", "$durationMinutesVal", 0] } },
                        totalTasks: { $sum: 1 }
                    }
                }
            ],
            topProjects: [
                {
                    $group: {
                        _id: { $ifNull: ["$project", "Unassigned"] },
                        minutes: { $sum: "$durationMinutesVal" },
                        tasks: { $sum: 1 }
                    }
                },
                { $project: { name: "$_id", hours: { $round: [{ $divide: ["$minutes", 60] }, 2] }, tasks: 1, _id: 0 } },
                { $sort: { hours: -1 } },
                { $limit: 5 }
            ],
            topCategories: [
                {
                    $group: {
                        _id: { $ifNull: ["$category", "other"] },
                        minutes: { $sum: "$durationMinutesVal" },
                        tasks: { $sum: 1 }
                    }
                },
                { $project: { name: "$_id", hours: { $round: [{ $divide: ["$minutes", 60] }, 2] }, tasks: 1, _id: 0 } },
                { $sort: { hours: -1 } }
            ],
            trend: [
                {
                    $group: {
                        _id: "$date",
                        minutes: { $sum: "$durationMinutesVal" },
                        tasks: { $sum: 1 }
                    }
                },
                { $project: { date: "$_id", hours: { $round: [{ $divide: ["$minutes", 60] }, 2] }, tasks: 1, _id: 0 } },
                { $sort: { date: 1 } }
            ]
        }
    }
];

const formatResult = (results) => {
    const data = results[0];
    const summary = data.summary[0] || { totalMinutes: 0, tasksCompletedCount: 0, productiveMinutes: 0, totalTasks: 0 };

    const totalHours = +(summary.totalMinutes / 60).toFixed(2);
    const productiveHours = +(summary.productiveMinutes / 60).toFixed(2);

    return {
        totalHours,
        productiveHours,
        nonProductiveHours: +(totalHours - productiveHours).toFixed(2),
        tasksCompleted: summary.tasksCompletedCount,
        completionRatio: summary.totalTasks > 0 ? +((summary.tasksCompletedCount / summary.totalTasks) * 100).toFixed(1) : 0,
        avgTaskDuration: summary.totalTasks > 0 ? +(summary.totalMinutes / summary.totalTasks).toFixed(1) : 0,
        topProjects: data.topProjects,
        topCategories: data.topCategories,
        trend: data.trend
    };
};

export const computeAnalysis = async (employeeId, fromDate, toDate) => {
    const eid = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    const matchQuery = {
        employee: eid,
        date: { $gte: fromDate, $lte: toDate }
    };

    const [summaryRes, projectsRes, categoriesRes, trendRes] = await Promise.all([
        // 1. Summary
        WorksheetEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalMinutes: { $sum: { $ifNull: ["$durationMinutes", 0] } },
                    tasksCompletedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    productiveMinutes: {
                        $sum: {
                            $cond: [
                                { $in: ["$category", PRODUCTIVE_CATEGORIES] },
                                { $ifNull: ["$durationMinutes", 0] },
                                0
                            ]
                        }
                    },
                    totalTasks: { $sum: 1 }
                }
            }
        ]),
        // 2. Top Projects
        WorksheetEntry.aggregate([
            { $match: matchQuery },
            { $group: { _id: { $ifNull: ["$project", "Unassigned"] }, hours: { $sum: { $divide: ["$durationMinutes", 60] } }, tasks: { $sum: 1 } } },
            { $project: { name: "$_id", hours: { $round: ["$hours", 2] }, tasks: 1, _id: 0 } },
            { $sort: { hours: -1 } },
            { $limit: 5 }
        ]),
        // 3. Top Categories
        WorksheetEntry.aggregate([
            { $match: matchQuery },
            { $group: { _id: { $ifNull: ["$category", "other"] }, hours: { $sum: { $divide: ["$durationMinutes", 60] } }, tasks: { $sum: 1 } } },
            { $project: { name: "$_id", hours: { $round: ["$hours", 2] }, tasks: 1, _id: 0 } },
            { $sort: { hours: -1 } }
        ]),
        // 4. Daily Trend
        WorksheetEntry.aggregate([
            { $match: matchQuery },
            { $group: { _id: "$date", hours: { $sum: { $divide: ["$durationMinutes", 60] } }, tasks: { $sum: 1 } } },
            { $project: { date: "$_id", hours: { $round: ["$hours", 2] }, tasks: 1, _id: 0 } },
            { $sort: { date: 1 } }
        ])
    ]);

    const summary = summaryRes[0] || { totalMinutes: 0, tasksCompletedCount: 0, productiveMinutes: 0, totalTasks: 0 };
    const totalHours = +(summary.totalMinutes / 60).toFixed(2);
    const productiveHours = +(summary.productiveMinutes / 60).toFixed(2);

    return {
        totalHours,
        productiveHours,
        nonProductiveHours: +(totalHours - productiveHours).toFixed(2),
        tasksCompleted: summary.tasksCompletedCount,
        completionRatio: summary.totalTasks > 0 ? +((summary.tasksCompletedCount / summary.totalTasks) * 100).toFixed(1) : 0,
        avgTaskDuration: summary.totalTasks > 0 ? +(summary.totalMinutes / summary.totalTasks).toFixed(1) : 0,
        topProjects: projectsRes,
        topCategories: categoriesRes,
        trend: trendRes
    };
};

export const computeTeamAnalysis = async (employeeIds, fromDate, toDate) => {
    const ids = employeeIds.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
    const matchQuery = {
        employee: { $in: ids },
        date: { $gte: fromDate, $lte: toDate }
    };

    const results = await WorksheetEntry.aggregate(getAnalysisAggregation(matchQuery));
    return formatResult(results);
};