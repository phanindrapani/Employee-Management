import PerformanceMetric from '../../models/performanceMetric.model.js';
import Task from '../../models/task.model.js';
import Attendance from '../../models/attendance.model.js';
import User from '../../models/user.model.js';
import Holiday from '../../models/holiday.model.js';
import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import mongoose from 'mongoose';
import { getIO } from '../../socket.js';

const calculateScore = async (userId, period) => {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

    const monthEndDate = new Date(year, month, 0, 23, 59, 59);

    const calcEndDate = isCurrentMonth ? now : monthEndDate;
    const effectiveEndDate = calcEndDate < startDate ? startDate : calcEndDate;

    const endDate = monthEndDate;

    const tasks = await Task.find({
        assignedTo: userId,
        createdAt: { $lte: endDate }
    });

    const isWithinPeriod = (date) => Boolean(date && date >= startDate && date <= endDate);
    const toEndOfDay = (date) => {
        if (!date) return null;
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const relevantTasks = tasks.filter((t) => {
        return isWithinPeriod(t.createdAt) || isWithinPeriod(t.updatedAt) || isWithinPeriod(t.completedAt);
    });

    const tasksAssigned = relevantTasks.length;
    const getCompletionRef = (task) => {
        if (task.completedAt) return task.completedAt;
        if (task.status === 'done') return task.updatedAt;
        return null;
    };

    const completedTasks = relevantTasks.filter((t) => {
        const ref = getCompletionRef(t);
        return isWithinPeriod(ref);
    });
    const tasksCompleted = completedTasks.length;
    const onTimeTasks = completedTasks.filter((t) => {
        const completionRef = getCompletionRef(t);
        return t.deadline && completionRef && completionRef <= toEndOfDay(t.deadline);
    }).length;


    const taskCompletionScore = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;
    const onTimeScore = tasksCompleted > 0 ? (onTimeTasks / tasksCompleted) * 100 : 0;

    // Attendance Metrics
    const holidays = await Holiday.find({
        date: { $gte: startDate, $lte: endDate }
    });
    const holidayDates = new Set(holidays.map(h => h.date.toDateString()));

    const attendanceRecords = await Attendance.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate }
    });

    let workingDays = 0;
    let tempDate = new Date(startDate);
    while (tempDate <= effectiveEndDate) {
        const isSunday = tempDate.getDay() === 0;
        const isHoliday = holidayDates.has(tempDate.toDateString());
        if (!isSunday && !isHoliday) {
            workingDays++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
    }

    const attendanceDays = attendanceRecords.filter(a => a.status === 'Present').length;
    const attendanceScore = workingDays > 0 ? Math.min((attendanceDays / workingDays) * 100, 100) : 0;

    // Team Contribution Metric (Weight-Based)
    let teamContributionScore = 0;
    const projectIds = [...new Set(relevantTasks.map(t => t.project?.toString()).filter(Boolean))];

    if (projectIds.length > 0) {
        const userProjectWeights = relevantTasks.reduce((sum, t) => sum + (t.weight || 1), 0);

        const allProjectTasks = await Task.find({
            project: { $in: projectIds },
            createdAt: { $lte: endDate }
        });

        const totalProjectWeights = allProjectTasks.reduce((sum, t) => sum + (t.weight || 1), 0);

        teamContributionScore = totalProjectWeights > 0 ? (userProjectWeights / totalProjectWeights) * 100 : 0;
    }

    const totalScore = (
        (taskCompletionScore * 0.6) +
        (onTimeScore * 0.1) +
        (attendanceScore * 0.1) +
        (teamContributionScore * 0.2)
    );

    let category = 'Needs Improvement';
    if (totalScore >= 85) category = 'Excellent';
    else if (totalScore >= 70) category = 'Good';
    else if (totalScore >= 50) category = 'Average';

    return {
        user: userId,
        period,
        tasksAssigned,
        tasksCompleted,
        onTimeTasks,
        attendanceDays,
        workingDays,
        taskCompletionScore,
        onTimeScore,
        attendanceScore,
        teamContributionScore,
        totalScore: Math.round(totalScore),
        category
    };
};

export const recalculatePerformanceForUser = async (userId, period) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const metrics = await calculateScore(userId, period);
    const savedMetric = await PerformanceMetric.findOneAndUpdate(
        { user: userId, period },
        metrics,
        { upsert: true, new: true }
    );

    // Sync individual score to all profiles
    const individualScore = Math.round(metrics.totalScore);
    await User.findByIdAndUpdate(userId, { individualPerformanceScore: individualScore });

    // If Team Lead, calculate and sync the averaged TEAM score
    if (user.role === 'team-lead') {
        const team = await Team.findOne({ teamLead: userId });

        if (team && team.members && team.members.length > 0) {
            const allMemberIds = [...team.members];

            const teamMetrics = await PerformanceMetric.find({
                user: { $in: allMemberIds },
                period
            });

            if (teamMetrics.length > 0) {
                const teamAvg = teamMetrics.reduce((sum, m) => sum + m.totalScore, 0) / teamMetrics.length;
                await User.findByIdAndUpdate(userId, { teamPerformanceScore: Math.round(teamAvg) });
            }
        }
    }
    if (user.role === 'employee') {
        await User.findByIdAndUpdate(userId, { teamPerformanceScore: individualScore });
    }

    // Socket Emit
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('performance:updated', savedMetric);
        io.to('role:admin').emit('performance:updated', savedMetric);
    } catch (e) { console.error('Socket emit error:', e); }

    // Chain update to Manager if applicable (so Lead's team average reflects this change immediately)
    if (user.reportingManager && user.reportingManager.toString() !== userId.toString()) {
        try {
            await recalculatePerformanceForUser(user.reportingManager, period);
        } catch (err) {
            console.error('Failed to update manager score:', err.message);
        }
    }

    return savedMetric;
};

export const triggerCalculation = async (req, res) => {
    try {
        const { period } = req.body; // "2026-02"
        const users = await User.find({ role: { $in: ['employee', 'team-lead'] } });

        const results = [];
        for (const user of users) {
            const savedMetric = await recalculatePerformanceForUser(user._id, period);
            results.push(savedMetric);
        }
        res.json({ message: "Performance calculated", count: results.length });
    } catch (error) {
        console.error("Calculation Error:", error);
        res.status(500).json({ message: "Calculation failed" });
    }
};

const updatePerformanceMetric = async (userId, period, updates) => {
    await PerformanceMetric.findOneAndUpdate(
        { user: userId, period },
        { ...updates },
        { upsert: true }
    );
};

export const getAdminPerformanceStats = async (req, res) => {
    try {
        const { period } = req.query;
        const metrics = await PerformanceMetric.find({ period })
            .populate('user', 'name role team department');

        if (metrics.length === 0) return res.json({
            summary: { totalTeams: 0, orgAvgScore: 0, highestTeamAvg: 0, teamsNeedingAttention: 0 },
            teams: [],
            topPerformers: []
        });

        const teams = await Team.find({}).populate('teamLead', 'name email').populate('members', 'name role');

        const teamStats = await Promise.all(teams.map(async (team) => {
            const memberIds = team.members.map(m => m._id.toString());
            if (team.teamLead && !memberIds.includes(team.teamLead._id.toString())) {
                memberIds.push(team.teamLead._id.toString());
            }
            const teamMetrics = metrics.filter(m => m.user && memberIds.includes(m.user._id.toString()));

            const avgScore = teamMetrics.length > 0
                ? Math.round(teamMetrics.reduce((sum, m) => sum + m.totalScore, 0) / teamMetrics.length)
                : 0;
            const highestScore = teamMetrics.length > 0
                ? Math.max(...teamMetrics.map(m => m.totalScore))
                : 0;
            const needsAttention = teamMetrics.filter(m => m.totalScore < 50).length;

            return {
                teamId: team._id,
                teamName: team.name,
                leadName: team.teamLead?.name || 'No Lead',
                leadId: team.teamLead?._id?.toString(),
                membersCount: memberIds.length,
                trackedCount: teamMetrics.length,
                avgScore,
                highestScore,
                needsAttention,
                members: [
                    ...(team.teamLead ? [{
                        name: team.teamLead.name,
                        score: metrics.find(m => m.user?._id?.toString() === team.teamLead._id.toString())?.totalScore || 0,
                        isLead: true
                    }] : []),
                    ...team.members
                        .filter(m => m._id.toString() !== team.teamLead?._id?.toString())
                        .map(m => ({
                            name: m.name,
                            score: metrics.find(met => met.user?._id?.toString() === m._id.toString())?.totalScore || 0,
                            isLead: false
                        }))
                ]
            };
        }));

        const orgAvgScore = teamStats.length > 0
            ? Math.round(teamStats.reduce((sum, t) => sum + t.avgScore, 0) / teamStats.filter(t => t.trackedCount > 0).length || 0)
            : 0;
        const highestTeamAvg = teamStats.length > 0 ? Math.max(...teamStats.map(t => t.avgScore)) : 0;
        const teamsNeedingAttention = teamStats.filter(t => t.needsAttention > 0).length;
        const topPerformers = [...metrics]
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5);

        res.json({
            summary: {
                totalTeams: teams.length,
                orgAvgScore,
                highestTeamAvg,
                teamsNeedingAttention
            },
            teams: teamStats.filter(t => t.membersCount > 0),
            topPerformers
        });
    } catch (error) {
        console.error('Admin perf stats error:', error);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};

export const getEmployeePerformanceProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { period } = req.query;

        const metric = await PerformanceMetric.findOne({ user: id, period });
        const history = await PerformanceMetric.find({ user: id }).sort({ period: 1 }).limit(6);
        res.json({
            current: metric || {},
            history
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};
