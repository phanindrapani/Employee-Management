import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';

export const getTeamReports = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id name');
        const memberIds = members.map(m => m._id);

        // 1. Productivity Trend (Last 7 Days)
        const productivityTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const completedTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                status: 'done',
                updatedAt: { $gte: date, $lt: nextDay }
            });

            const totalTasks = await Task.countDocuments({
                assignedTo: { $in: memberIds },
                updatedAt: { $gte: date, $lt: nextDay }
            });

            productivityTrend.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                tasks: completedTasks,
                efficiency: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            });
        }

        // 2. Member Contribution (Total Completed Tasks)
        const contributionData = await Promise.all(members.map(async (member) => {
            const completedCount = await Task.countDocuments({
                assignedTo: member._id,
                status: 'done'
            });
            return {
                name: member.name,
                value: completedCount
            };
        }));

        // Filter out members with 0 contribution to keep chart clean
        const activeContribution = contributionData.filter(d => d.value > 0);

        // 3. Summary Stats (Achievement & Consistency)
        const totalCompleted = activeContribution.reduce((acc, curr) => acc + curr.value, 0);
        const totalPending = await Task.countDocuments({
            assignedTo: { $in: memberIds },
            status: { $ne: 'done' }
        });

        const achievementRate = totalPending + totalCompleted > 0
            ? Math.round((totalCompleted / (totalPending + totalCompleted)) * 100)
            : 0;

        res.json({
            productivityTrend,
            contributionData: activeContribution,
            summary: {
                achievementRate,
                totalCompleted,
                teamSize: members.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate team reports" });
    }
};
