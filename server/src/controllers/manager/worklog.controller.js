import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import WorksheetEntry from '../../models/worksheetEntry.model.js';
import { computeTeamAnalysis } from '../../utils/worksheet/analysisEngine.js';

export const getManagerWorkLogs = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });

        // Get all members from all teams managed by this manager
        const memberIds = teams.reduce((acc, team) => {
            team.members.forEach(m => {
                if (!acc.includes(m.toString())) acc.push(m.toString());
            });
            return acc;
        }, []);

        const workLogs = await WorksheetEntry.find({ employee: { $in: memberIds } })
            .populate('employee', 'name email')
            .sort({ date: -1, startTime: -1 })
            .limit(100);

        res.json(workLogs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch work logs" });
    }
};

export const getManagerWorkLogStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const memberIds = teams.reduce((acc, team) => {
            team.members.forEach(m => {
                if (!acc.includes(m.toString())) acc.push(m.toString());
            });
            return acc;
        }, []);

        const stats = await WorksheetEntry.aggregate([
            { $match: { employee: { $in: memberIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            {
                $group: {
                    _id: "$category",
                    totalMinutes: { $sum: "$durationMinutes" },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch work log stats" });
    }
};

export const getManagerWorkLogAnalysis = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { fromDate, toDate } = req.query;
        const today = new Date().toISOString().slice(0, 10);
        const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = toDate || today;

        const teams = await Team.find({ manager: managerId });

        // Build employee to team mapping
        const employeeToTeamMap = {};
        const memberIds = [];
        teams.forEach(team => {
            team.members.forEach(m => {
                const idStr = m.toString();
                if (!memberIds.includes(idStr)) {
                    memberIds.push(idStr);
                }
                employeeToTeamMap[idStr] = team.name;
            });
        });

        // Compute baseline metrics using shared utility
        const analysis = await computeTeamAnalysis(memberIds, from, to);

        // Fetch entries again with employee populated to compute the team-specific employee distribution
        const entries = await WorksheetEntry.find({
            employee: { $in: memberIds },
            date: { $gte: from, $lte: to }
        }).populate('employee', 'name').lean();

        const teamEmployeeMap = {};

        // Pre-seed ALL teams so those with 0 hours still appear in the chart
        teams.forEach(team => {
            teamEmployeeMap[team.name] = { name: team.name };
        });

        entries.forEach(e => {
            let empIdStr;
            let empName = 'Unknown Employee';

            if (e.employee && e.employee._id) {
                empIdStr = e.employee._id.toString();
                empName = e.employee.name || empName;
            } else if (e.employee) {
                empIdStr = e.employee.toString();
            }

            const teamName = employeeToTeamMap[empIdStr] || 'Unknown Team';

            if (!teamEmployeeMap[teamName]) {
                teamEmployeeMap[teamName] = { name: teamName };
            }
            if (!teamEmployeeMap[teamName][empName]) {
                teamEmployeeMap[teamName][empName] = 0;
            }
            teamEmployeeMap[teamName][empName] += e.durationMinutes / 60;
        });

        // Format and sort teamEmployeeDistribution
        const teamEmployeeDistribution = Object.values(teamEmployeeMap).map(team => {
            // Round all employee hours
            const roundedTeam = { name: team.name };
            let totalTeamHours = 0;
            for (const key in team) {
                if (key !== 'name') {
                    const hours = +(team[key]).toFixed(2);
                    roundedTeam[key] = hours;
                    totalTeamHours += hours;
                }
            }
            roundedTeam.totalHours = totalTeamHours;
            return roundedTeam;
        }).sort((a, b) => b.totalHours - a.totalHours);

        res.json({
            fromDate: from,
            toDate: to,
            ...analysis,
            teamEmployeeDistribution
        });
    } catch (error) {
        console.error('Error fetching manager work log analysis:', error);
        res.status(500).json({ message: "Failed to fetch work log analysis" });
    }
};
