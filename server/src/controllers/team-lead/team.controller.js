import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import Leave from '../../models/leave.model.js';
import PerformanceMetric from '../../models/performanceMetric.model.js';
import mongoose from 'mongoose';

export const getTeamMembers = async (req, res) => {
    try {
        const teamId = req.user.team;

        // 1. Fetch members with lean
        const members = await User.find({ team: teamId })
            .select('name email phone role experienceLevel skills profilePicture isActive individualPerformanceScore')
            .lean();

        if (!members.length) {
            return res.json({ members: [], metadata: { teamName: 'My Team', departmentName: 'Human Resources' } });
        }

        const memberIds = members.map(m => m._id);

        // 2. Batch fetch task counts
        const taskCounts = await Task.aggregate([
            { $match: { assignedTo: { $in: memberIds }, status: { $in: ['todo', 'in-progress'] } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
        ]);
        const taskCountMap = Object.fromEntries(taskCounts.map(tc => [tc._id.toString(), tc.count]));

        // 3. Batch fetch leave status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeLeaves = await Leave.find({
            user: { $in: memberIds },
            status: 'approved',
            fromDate: { $lte: today },
            toDate: { $gte: today }
        }).select('user').lean();
        const leaveSet = new Set(activeLeaves.map(l => l.user.toString()));

        // 4. Team and Dept info (Lean)
        const teamInfo = await User.findById(req.user._id)
            .select('team department')
            .populate('team', 'name')
            .populate('department', 'name')
            .lean();

        const membersEnhanced = members.map(member => ({
            ...member,
            activeTasks: taskCountMap[member._id.toString()] || 0,
            isOnLeave: leaveSet.has(member._id.toString())
        }));

        res.json({
            members: membersEnhanced,
            metadata: {
                teamName: teamInfo?.team?.name || 'My Team',
                departmentName: teamInfo?.department?.name || 'Human Resources'
            }
        });
    } catch (error) {
        console.error('Error in getTeamMembers:', error);
        res.status(500).json({ message: "Failed to fetch team members" });
    }
};

export const calculateTeamPerformanceScore = async (req, res) => {
    try {
        const teamLeadId = req.user._id;
        const teamId = req.user.team;

        const members = await User.find({ team: teamId })
            .select('individualPerformanceScore')
            .lean();

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
        console.error('Error in calculateTeamPerformanceScore:', error);
        res.status(500).json({ message: "Failed to calculate team performance score" });
    }
};

export const getTeamMemberPerformance = async (req, res) => {
    try {
        const teamId = req.user.team;
        const date = new Date();
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const members = await User.find({ team: teamId })
            .select('name email role profilePicture individualPerformanceScore')
            .lean();

        const memberIds = members.map(m => m._id);
        const metrics = await PerformanceMetric.find({
            user: { $in: memberIds },
            period
        }).select('user taskCompletionScore attendanceScore totalScore period').lean();

        const metricMap = {};
        for (const m of metrics) {
            metricMap[m.user.toString()] = m;
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
        console.error('Error in getTeamMemberPerformance:', error);
        res.status(500).json({ message: "Failed to fetch team performance" });
    }
};
