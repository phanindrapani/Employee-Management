import Performance from '../../models/performance.model.js';
import PerformanceMetric from '../../models/performanceMetric.model.js';
import Task from '../../models/task.model.js';
import Attendance from '../../models/attendance.model.js';
import User from '../../models/user.model.js';
import Holiday from '../../models/holiday.model.js';
import { getIO } from '../../socket.js';

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
        // await updatePerformanceMetric(employee, reviewPeriod, { teamContributionScore: rating * 20 }); // removed legacy hook

        // Socket Emit
        try {
            const io = getIO();
            io.to(`user:${employee}`).emit('review:created', review);
            // Trigger score update notification separately in updatePerformanceMetric?
        } catch (e) { console.error('Socket emit error:', e); }

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
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

    // End date for fetching tasks/attendance (tasks can be anytime in month, but usually up to now)
    const monthEndDate = new Date(year, month, 0, 23, 59, 59);

    // For calculation loop, use effective end date
    const calcEndDate = isCurrentMonth ? now : monthEndDate;
    // Ensure we don't go before start date (e.g. if checking future month? shouldn't happen)
    const effectiveEndDate = calcEndDate < startDate ? startDate : calcEndDate;

    const endDate = monthEndDate; // Keep original for DB queries range

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

    // 2. Attendance Metrics
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

    // 3. Team Contribution Metric (Weight-Based)
    let teamContributionScore = 0;
    const projectIds = [...new Set(relevantTasks.map(t => t.project?.toString()).filter(Boolean))];

    if (projectIds.length > 0) {
        // user's total weight in these projects
        const userProjectWeights = relevantTasks.reduce((sum, t) => sum + (t.weight || 1), 0);

        // total weight of ALL tasks in these projects (for anyone in the team)
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
    const metrics = await calculateScore(userId, period);
    const savedMetric = await PerformanceMetric.findOneAndUpdate(
        { user: userId, period },
        metrics,
        { upsert: true, new: true }
    );

    // Sync the calculated score to the User profile so the Profile page reflects it
    await User.findByIdAndUpdate(userId, { teamPerformanceScore: Math.round(metrics.totalScore) });

    // Socket Emit
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('performance:updated', savedMetric);
        io.to('role:admin').emit('performance:updated', savedMetric);
    } catch (e) { console.error('Socket emit error:', e); }

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
        res.json({
            current: metric || {},
            history
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};
