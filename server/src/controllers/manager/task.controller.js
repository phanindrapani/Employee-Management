import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import mongoose from 'mongoose';

export const getManagerTaskDashboard = async (req, res) => {
    try {
        const managerId = req.user.id;
        const now = new Date();

        // 1. Initial Data: Teams and Projects
        const teams = await Team.find({ manager: managerId }).select('name members').lean();
        const teamIds = teams.map(t => t._id);
        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        }).select('name').lean();
        const projectIds = projects.map(p => p._id);
        const allMemberIds = Array.from(new Set(teams.flatMap(t => t.members.map(m => m._id.toString())))).map(id => new mongoose.Types.ObjectId(id));

        if (projectIds.length === 0) {
            return res.json({
                summary: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, blocked: 0 },
                teamBreakdown: [],
                employeeWorkload: [],
                projectProgress: [],
                recentActivity: [],
                taskList: [],
                overdueDetailed: []
            });
        }

        // 2. Parallel Data Fetching
        const [
            mainStats,
            teamStatsRaw,
            employeeWorkload,
            projectStatsRaw,
            recentActivity,
            taskList,
            overdueDetailed
        ] = await Promise.all([
            // Global Summary Metrics
            Task.aggregate([
                { $match: { project: { $in: projectIds } } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        overdueCount: {
                            $sum: {
                                $cond: [{ $and: [{ $lt: ["$deadline", now] }, { $ne: ["$status", "done"] }] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            // Consolidated Team Breakdown
            Task.aggregate([
                { $match: { teamId: { $in: teamIds } } },
                {
                    $group: {
                        _id: { teamId: "$teamId", status: "$status" },
                        count: { $sum: 1 },
                        overdue: { $sum: { $cond: [{ $and: [{ $lt: ["$deadline", now] }, { $ne: ["$status", "done"] }] }, 1, 0] } }
                    }
                }
            ]),
            // Employee Workload
            Task.aggregate([
                { $match: { assignedTo: { $in: allMemberIds } } },
                {
                    $group: {
                        _id: "$assignedTo",
                        totalTasks: { $sum: 1 },
                        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                        overdue: { $sum: { $cond: [{ $and: [{ $lt: ["$deadline", now] }, { $ne: ["$status", "done"] }] }, 1, 0] } }
                    }
                },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: "$user" },
                { $project: { name: "$user.name", totalTasks: 1, inProgress: 1, overdue: 1 } }
            ]),
            // Project Progress
            Task.aggregate([
                { $match: { project: { $in: projectIds } } },
                {
                    $group: {
                        _id: "$project",
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } }
                    }
                }
            ]),
            // Recent Activity
            Task.find({ project: { $in: projectIds } })
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate('assignedTo', 'name')
                .select('title status updatedAt assignedTo')
                .lean(),
            // Main Task List (limited or filtered)
            (async () => {
                const { status, priority, search, team: teamFilter, project: projectFilter } = req.query;
                let q = { project: { $in: projectIds } };
                if (teamFilter) {
                    const tProjects = await Project.find({ assignedTeams: teamFilter }).select('_id').lean();
                    q.project = { $in: tProjects.map(p => p._id) };
                }
                if (projectFilter) q.project = projectFilter;
                if (status) q.status = status;
                if (priority) q.priority = priority;
                if (search) q.title = { $regex: search, $options: 'i' };

                return Task.find(q)
                    .populate('assignedTo', 'name')
                    .populate('project', 'name')
                    .sort({ deadline: 1 })
                    .limit(100) // Sanity limit for dashboard
                    .lean();
            })(),
            // Overdue Detailed
            Task.find({
                project: { $in: projectIds },
                status: { $ne: 'done' },
                deadline: { $lt: now }
            })
                .populate('assignedTo', 'name')
                .populate('project', 'name')
                .sort({ deadline: 1 })
                .lean()
        ]);

        // 3. Post-process Data
        const summary = {
            total: mainStats.reduce((acc, curr) => acc + curr.count, 0),
            pending: mainStats.find(s => s._id === 'todo')?.count || 0,
            inProgress: mainStats.find(s => s._id === 'in-progress')?.count || 0,
            completed: mainStats.find(s => s._id === 'done')?.count || 0,
            overdue: mainStats.reduce((acc, curr) => acc + curr.overdueCount, 0),
            blocked: mainStats.find(s => s._id === 'blocked')?.count || 0
        };

        const teamBreakdown = teams.map(team => {
            const stats = teamStatsRaw.filter(s => s._id.teamId.toString() === team._id.toString());
            return {
                teamId: team._id,
                teamName: team.name,
                total: stats.reduce((acc, curr) => acc + curr.count, 0),
                completed: stats.find(s => s._id.status === 'done')?.count || 0,
                inProgress: stats.find(s => s._id.status === 'in-progress')?.count || 0,
                overdue: stats.reduce((acc, curr) => acc + curr.overdue, 0)
            };
        });

        const projectProgress = projects.map(p => {
            const stats = projectStatsRaw.find(s => s._id.toString() === p._id.toString());
            const total = stats?.total || 0;
            const completed = stats?.completed || 0;
            return {
                projectId: p._id,
                projectName: p.name,
                totalTasks: total,
                completed: completed,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        res.json({
            summary,
            teamBreakdown,
            employeeWorkload,
            projectProgress,
            recentActivity,
            taskList,
            overdueDetailed
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

export const getManagerTaskStats = async (req, res) => {
    try {
        const managerId = req.user._id || req.user.id;
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);
        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        });
        const projectIds = projects.map(p => p._id);
        const stats = await Task.aggregate([
            { $match: { project: { $in: projectIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch task stats" });
    }
};

export const getManagerOverdueTasks = async (req, res) => {
    try {
        const managerId = req.user._id || req.user.id;
        const teams = await Team.find({ manager: managerId });
        const teamIds = teams.map(t => t._id);
        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        });
        const projectIds = projects.map(p => p._id);
        const now = new Date();
        const overdueTasks = await Task.find({
            project: { $in: projectIds },
            status: { $ne: 'done' },
            deadline: { $lt: now }
        }).populate('assignedTo', 'name email').populate('project', 'name');
        res.json(overdueTasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue tasks" });
    }
};

