import PerformanceMetric from '../../models/performanceMetric.model.js';
import Team from '../../models/team.model.js';
import Project from '../../models/project.model.js';
import mongoose from 'mongoose';

/**
 * GET /manager/performance/dashboard
 * Returns performance stats for all teams managed by the logged-in manager.
 */
export const getManagerPerformanceStats = async (req, res) => {
    try {
        const period = req.query.period || new Date().toISOString().slice(0, 7);
        const managerId = req.user._id;

        // 1. Fetch all teams managed by this manager
        const teams = await Team.find({ manager: managerId })
            .populate('teamLead', 'name email')
            .populate('members', 'name role')
            .populate('department', 'name text color');

        if (teams.length === 0) return res.json({
            summary: { totalTeams: 0, totalEmployees: 0, activeProjects: 0, orgAvgScore: 0, highestTeamAvg: 0, teamsNeedingAttention: 0 },
            teams: [],
            topPerformers: [],
            performanceTrend: [],
            topLeads: []
        });

        const teamIds = teams.map(t => t._id);
        const allMemberIds = new Set();
        teams.forEach(t => {
            t.members.forEach(m => allMemberIds.add(m._id.toString()));
            if (t.teamLead) allMemberIds.add(t.teamLead._id.toString());
        });

        // 2. Fetch Metrics for the current period
        const metrics = await PerformanceMetric.find({
            period,
            user: { $in: Array.from(allMemberIds).map(id => new mongoose.Types.ObjectId(id)) }
        }).populate('user', 'name role department');

        // 3. Fetch Active Projects
        const activeProjectsCount = await Project.countDocuments({
            assignedTeams: { $in: teamIds },
            status: { $in: ['ongoing', 'upcoming', 'on-hold'] }
        });

        // 4. Calculate Team Stats
        const teamStats = teams.map(team => {
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
        });

        // 5. Aggregate Summary
        const orgAvgScore = teamStats.length > 0
            ? Math.round(teamStats.reduce((sum, t) => sum + t.avgScore, 0) / teamStats.length)
            : 0;
        const highestTeamAvg = teamStats.length > 0 ? Math.max(...teamStats.map(t => t.avgScore)) : 0;
        const teamsNeedingAttention = teamStats.filter(t => t.avgScore < 60).length;

        // 6. Performance Trend (Last 6 Months)
        const periods = [];
        const date = new Date(period + "-01");
        for (let i = 5; i >= 0; i--) {
            const d = new Date(date);
            d.setMonth(d.getMonth() - i);
            periods.push(d.toISOString().slice(0, 7));
        }

        const trendMetrics = await PerformanceMetric.find({
            period: { $in: periods },
            user: { $in: Array.from(allMemberIds).map(id => new mongoose.Types.ObjectId(id)) }
        });

        const performanceTrend = periods.map(p => {
            const periodMetrics = trendMetrics.filter(m => m.period === p);
            const avg = periodMetrics.length > 0
                ? Math.round(periodMetrics.reduce((sum, m) => sum + m.totalScore, 0) / periodMetrics.length)
                : 0;
            return { name: p, score: avg };
        });

        // 7. Top Leads
        const topLeads = teamStats
            .filter(ts => ts.leadId)
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 5)
            .map(t => ({
                name: t.leadName,
                score: t.avgScore,
                team: t.teamName
            }));

        res.json({
            summary: {
                totalTeams: teams.length,
                totalEmployees: allMemberIds.size,
                activeProjects: activeProjectsCount,
                orgAvgScore,
                highestTeamAvg,
                teamsNeedingAttention
            },
            teams: teamStats,
            performanceTrend,
            topLeads,
            topPerformers: metrics.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5)
        });
    } catch (error) {
        console.error('Manager perf stats error:', error);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};
