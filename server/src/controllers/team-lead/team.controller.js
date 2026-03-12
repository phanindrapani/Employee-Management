import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import Leave from '../../models/leave.model.js';
import PerformanceMetric from '../../models/performanceMetric.model.js';

export const getTeamMembers = async (req, res) => {
    try {
        const teamId = req.user.team;

        const members = await User.find({ team: teamId })
            .select('name email phone role experienceLevel skills profilePicture isActive individualPerformanceScore');

        const teamInfo = await User.findById(req.user._id)
            .populate({
                path: 'team',
                select: 'name'
            })
            .populate({
                path: 'department',
                select: 'name'
            });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const membersEnhanced = await Promise.all(members.map(async (member) => {
            const taskCount = await Task.countDocuments({
                assignedTo: member._id,
                status: { $in: ['todo', 'in-progress'] }
            });

            const isOnLeave = await Leave.exists({
                user: member._id,
                status: 'approved',
                fromDate: { $lte: today },
                toDate: { $gte: today }
            });

            return {
                ...member.toObject(),
                activeTasks: taskCount,
                isOnLeave: !!isOnLeave
            };
        }));

        res.json({
            members: membersEnhanced,
            metadata: {
                teamName: teamInfo.team?.name || 'My Team',
                departmentName: teamInfo.department?.name || 'Human Resources'
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team members" });
    }
};

export const calculateTeamPerformanceScore = async (req, res) => {
    try {
        const teamLeadId = req.user._id;
        const teamId = req.user.team;

        const members = await User.find({ team: teamId })
            .select('individualPerformanceScore');

        if (!members || members.length === 0) {
            await User.findByIdAndUpdate(teamLeadId, { teamPerformanceScore: 0 });
            return res.json({ teamAverage: 0, membersCount: 0, message: 'No team members found' });
        }

        const validScores = members
            .map(m => m.individualPerformanceScore || 0)
            .filter(score => score > 0);

        const teamAverage = validScores.length > 0
            ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
            : 0;

        await User.findByIdAndUpdate(teamLeadId, { teamPerformanceScore: teamAverage });

        res.json({
            teamAverage,
            membersCount: members.length,
            activeMembersCount: validScores.length,
            message: 'Team performance score calculated'
        });
    } catch (error) {
        console.error('Calculate team performance error:', error);
        res.status(500).json({ message: "Failed to calculate team performance score" });
    }
};

export const getTeamMemberPerformance = async (req, res) => {
    try {
        const teamId = req.user.team;
        const date = new Date();
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const members = await User.find({ team: teamId })
            .select('name email role profilePicture individualPerformanceScore');

        const memberIds = members.map(m => m._id);
        const metrics = await PerformanceMetric.find({
            user: { $in: memberIds },
            period
        }).populate('user', 'name email role profilePicture individualPerformanceScore');

        const metricMap = {};
        for (const m of metrics) {
            metricMap[m.user._id.toString()] = m;
        }

        const result = members.map(member => {
            const metric = metricMap[member._id.toString()];
            return {
                _id: member._id,
                name: member.name,
                email: member.email,
                role: member.role,
                profilePicture: member.profilePicture,
                individualPerformanceScore: member.individualPerformanceScore || 0,
                taskCompletionScore: metric?.taskCompletionScore || 0,
                attendanceScore: metric?.attendanceScore || 0,
                totalScore: metric?.totalScore || 0,
                period
            };
        });

        const avgScore = result.length > 0
            ? Math.round(result.reduce((sum, m) => sum + m.totalScore, 0) / result.length)
            : 0;

        res.json({ members: result, avgScore, period });
    } catch (error) {
        console.error('Team member performance error:', error);
        res.status(500).json({ message: "Failed to fetch team performance" });
    }
};
