import Goal from '../models/goal.model.js';
import Performance from '../models/performance.model.js';
import PerformanceMetric from '../models/performanceMetric.model.js';
import Task from '../models/task.model.js';
import Attendance from '../models/attendance.model.js';
import WorkLog from '../models/workLog.model.js';
import User from '../models/user.model.js';

// ==================================================
// GOAL MANAGEMENT
// ==================================================

export const createGoal = async (req, res) => {
    try {
        const { title, description, deadline, assignedTo } = req.body;
        const goal = await Goal.create({
            title,
            description,
            deadline,
            assignedTo,
            createdBy: req.user._id
        });
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create goal" });
    }
};

export const getGoals = async (req, res) => {
    try {
        const { employeeId } = req.query; // Changed to query param
        const query = employeeId ? { assignedTo: employeeId } : {};

        // If employee, can only see own goals
        if (req.user.role === 'employee') {
            query.assignedTo = req.user._id;
        }

        const goals = await Goal.find(query).populate('assignedTo', 'name').populate('createdBy', 'name').sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch goals" });
    }
};

export const updateGoalStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const goal = await Goal.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: "Failed to update goal" });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: "Goal deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete goal" });
    }
};

// ==================================================
// PERFORMANCE REVIEWS (Manual)
// ==================================================

export const createPerformanceReview = async (req, res) => {
    try {
        const { employee, rating, feedback, kpis, reviewPeriod } = req.body;

        const review = await Performance.create({
            employee,
            reviewer: req.user._id,
            rating,
            feedback,
            kpis,
            reviewPeriod
        });

        // Update metric manually if exists
        await updatePerformanceMetric(employee, reviewPeriod, { teamContributionScore: rating * 20 }); // simple hook

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create review" });
    }
};

export const getPerformanceReviews = async (req, res) => {
    try {
        const { employeeId } = req.query;
        const query = employeeId ? { employee: employeeId } : {};

        if (req.user.role === 'employee') {
            query.employee = req.user._id;
        }

        const reviews = await Performance.find(query)
            .populate('employee', 'name department role')
            .populate('reviewer', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
};

// ==================================================
// AUTOMATED SCORING ENGINE
// ==================================================

const calculateScore = async (userId, period) => {
    // Period format "YYYY-MM"
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Task Metrics
    // Pull tasks up to period end, then filter in-memory by relevant activity in this period.
    // This avoids missing tasks that were created earlier but completed this month.
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

    const relevantTasks = tasks.filter((t) =>
        isWithinPeriod(t.createdAt) ||
        isWithinPeriod(t.updatedAt) ||
        isWithinPeriod(t.completedAt)
    );

    const tasksAssigned = relevantTasks.length;
    const getCompletionRef = (task) => {
        if (task.completedAt) return task.completedAt;
        // Legacy/backfilled tasks may be marked done without completedAt.
        // Fallback to updatedAt so they're still counted in period metrics.
        if (task.status === 'done') return task.updatedAt;
        return null;
    };

    const completedTasks = relevantTasks.filter((t) => isWithinPeriod(getCompletionRef(t)));
    const tasksCompleted = completedTasks.length;
    const onTimeTasks = completedTasks.filter((t) => {
        const completionRef = getCompletionRef(t);
        return t.deadline && completionRef && completionRef <= toEndOfDay(t.deadline);
    }).length;

    const debugTaskIds = relevantTasks.map(t => t._id?.toString());
    const doneWithoutCompletedAt = relevantTasks.filter(t => t.status === 'done' && !t.completedAt).length;
    console.log(
        `[DEBUG][Performance] user=${userId} period=${period} tasksFetched=${tasks.length} relevant=${relevantTasks.length} completed=${tasksCompleted} onTime=${onTimeTasks} doneWithoutCompletedAt=${doneWithoutCompletedAt} taskIds=${debugTaskIds.join(',')}`
    );

    const taskCompletionScore = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;
    const onTimeScore = tasksCompleted > 0 ? (onTimeTasks / tasksCompleted) * 100 : 0;

    // 2. Attendance Metrics
    const attendanceRecords = await Attendance.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate }
    });

    // Assume 22 working days for now, or calculate based on business days
    const workingDays = 22;
    const attendanceDays = attendanceRecords.filter(a => a.status === 'Present').length;
    const attendanceScore = (attendanceDays / workingDays) * 100 > 100 ? 100 : (attendanceDays / workingDays) * 100;

    // 3. Work Logs
    const workLogs = await WorkLog.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate }
    });

    const loggedHours = workLogs.reduce((sum, log) => sum + log.hours, 0);
    const expectedHours = workingDays * 8;
    const workLogScore = (loggedHours / expectedHours) * 100 > 100 ? 100 : (loggedHours / expectedHours) * 100;

    // 4. Retrieve Manager Rating (Team Contribution) from latest Review
    const latestReview = await Performance.findOne({ employee: userId, reviewPeriod: period });
    const teamContributionScore = latestReview ? (latestReview.rating / 5) * 100 : 70; // Default 70 if no review

    // WEIGHTED CALCULATION
    // Tasks: 40%, OnTime: 20%, Logs: 20%, Team: 10%, Attendance: 10%
    const totalScore = (
        (taskCompletionScore * 0.4) +
        (onTimeScore * 0.2) +
        (workLogScore * 0.2) +
        (teamContributionScore * 0.1) +
        (attendanceScore * 0.1)
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
        loggedHours,
        taskCompletionScore,
        onTimeScore,
        attendanceScore,
        workLogScore,
        teamContributionScore,
        totalScore: Math.round(totalScore),
        category
    };
};

export const recalculatePerformanceForUser = async (userId, period) => {
    const metrics = await calculateScore(userId, period);
    const savedMetric = await PerformanceMetric.findOneAndUpdate(
        { user: userId, period },
        metrics,
        { upsert: true, new: true }
    );
    console.log(
        `[DEBUG][Performance] savedMetric user=${userId} period=${period} total=${savedMetric?.totalScore} tasks=${savedMetric?.tasksCompleted}/${savedMetric?.tasksAssigned} onTime=${savedMetric?.onTimeTasks} attendance=${savedMetric?.attendanceDays}/${savedMetric?.workingDays} logs=${savedMetric?.loggedHours}`
    );
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

// Single User Update (Helper)
const updatePerformanceMetric = async (userId, period, updates) => {
    // Only updates specific fields, doesn't re-run full calc logic here for simplicity
    await PerformanceMetric.findOneAndUpdate(
        { user: userId, period },
        { ...updates },
        { upsert: true }
    );
};

// ==================================================
// DASHBOARD ANALYTICS
// ==================================================

export const getAdminPerformanceStats = async (req, res) => {
    try {
        const { period } = req.query; // "2026-02"
        const metrics = await PerformanceMetric.find({ period }).populate('user', 'name department role profilePicture');

        if (metrics.length === 0) return res.json({
            summary: {},
            topPerformers: [],
            needsAttention: [],
            distribution: []
        });

        const totalScore = metrics.reduce((sum, m) => sum + m.totalScore, 0);
        const avgScore = (totalScore / metrics.length).toFixed(1);

        const topPerformers = [...metrics].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
        const needsAttention = metrics.filter(m => m.totalScore < 50);

        res.json({
            summary: {
                totalEmployees: metrics.length,
                avgScore,
                topScore: topPerformers[0]?.totalScore || 0
            },
            topPerformers,
            needsAttention,
            distribution: metrics.map(m => ({
                name: m.user.name,
                score: m.totalScore,
                tasks: m.taskCompletionScore,
                role: m.user.role
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};

export const getEmployeePerformanceProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { period } = req.query;

        const metric = await PerformanceMetric.findOne({ user: id, period });
        const history = await PerformanceMetric.find({ user: id }).sort({ period: 1 }).limit(6);
        const goals = await Goal.find({ assignedTo: id }).sort({ createdAt: -1 });

        res.json({
            current: metric || {},
            history,
            goals
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};
