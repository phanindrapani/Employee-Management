import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';
import mongoose from 'mongoose';

export const getManagerTaskDashboard = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId }).populate('members', 'name role');
        const teamIds = teams.map(t => t._id);
        const projects = await Project.find({
            $or: [
                { managerId: managerId },
                { assignedTeams: { $in: teamIds } }
            ]
        });
        const projectIds = projects.map(p => p._id);

        const now = new Date();

        // Summary Metrics
        const stats = await Task.aggregate([
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
        ]);

        const summary = {
            total: stats.reduce((acc, curr) => acc + curr.count, 0),
            pending: stats.find(s => s._id === 'todo')?.count || 0,
            inProgress: stats.find(s => s._id === 'in-progress')?.count || 0,
            completed: stats.find(s => s._id === 'done')?.count || 0,
            overdue: stats.reduce((acc, curr) => acc + curr.overdueCount, 0),
            blocked: stats.find(s => s._id === 'blocked')?.count || 0
        };

        // Team Task Breakdown
        const teamBreakdown = await Promise.all(teams.map(async (team) => {
            const teamProjects = await Project.find({ assignedTeams: team._id });
            const teamProjectIds = teamProjects.map(p => p._id);
            const teamStats = await Task.aggregate([
                { $match: { project: { $in: teamProjectIds } } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        overdue: { $sum: { $cond: [{ $and: [{ $lt: ["$deadline", now] }, { $ne: ["$status", "done"] }] }, 1, 0] } }
                    }
                }
            ]);

            return {
                teamName: team.name,
                total: teamStats.reduce((acc, curr) => acc + curr.count, 0),
                completed: teamStats.find(s => s._id === 'done')?.count || 0,
                inProgress: teamStats.find(s => s._id === 'in-progress')?.count || 0,
                overdue: teamStats.reduce((acc, curr) => acc + curr.overdue, 0)
            };
        }));

        // Employee Workload
        const allMemberIds = teams.flatMap(t => t.members.map(m => m._id));
        const employeeWorkload = await Task.aggregate([
            { $match: { assignedTo: { $in: allMemberIds } } },
            {
                $group: {
                    _id: "$assignedTo",
                    totalTasks: { $sum: 1 },
                    inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $and: [{ $lt: ["$deadline", now] }, { $ne: ["$status", "done"] }] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    name: "$user.name",
                    totalTasks: 1,
                    inProgress: 1,
                    overdue: 1
                }
            }
        ]);

        // Project Progress (Actual Aggregation)
        const projectProgress = await Promise.all(projects.map(async (p) => {
            const pStats = await Task.aggregate([
                { $match: { project: p._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } }
                    }
                }
            ]);

            const total = pStats[0]?.total || 0;
            const completed = pStats[0]?.completed || 0;
            return {
                projectName: p.name,
                totalTasks: total,
                completed: completed,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }));

        // Recent Activity (Last 5 updates)
        const recentActivity = await Task.find({ project: { $in: projectIds } })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('assignedTo', 'name')
            .select('title status updatedAt assignedTo');

        // Filtered Task List (For Main Table)
        const { status, priority, search } = req.query;
        let query = { project: { $in: projectIds } };

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        const taskList = await Task.find(query)
            .populate('assignedTo', 'name')
            .populate('project', 'name')
            .sort({ deadline: 1 });

        // Overdue Detailed (Global Oversight - NOT affected by table filters)
        const overdueDetailed = await Task.find({
            project: { $in: projectIds },
            status: { $ne: 'done' },
            deadline: { $lt: now }
        })
            .populate('assignedTo', 'name')
            .populate('project', 'name')
            .sort({ deadline: 1 });

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

