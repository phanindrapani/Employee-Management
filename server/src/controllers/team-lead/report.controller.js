import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import { getProductivityTrend } from '../../services/stats.service.js';

export const getTeamReports = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id name');
        const memberIds = members.map(m => m._id);

        // Productivity Trend (Last 7 Days) - synchronized with Dashboard logic
        const productivityTrend = await getProductivityTrend(memberIds);

        // Member Contribution (Total Completed Tasks)
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

        const activeContribution = contributionData.filter(d => d.value > 0);

        // Summary Stats (Achievement & Consistency)
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
