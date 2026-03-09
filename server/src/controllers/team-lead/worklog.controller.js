import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import WorksheetEntry from '../../models/worksheetEntry.model.js';

export const getTeamLeadWorkLogs = async (req, res) => {
    try {
        const teamLeadId = req.user.id;
        // Find team where this user is the team lead
        const team = await Team.findOne({ lead: teamLeadId });

        const memberIds = team ? [...team.members, teamLeadId] : [teamLeadId];

        const workLogs = await WorksheetEntry.find({ employee: { $in: memberIds } })
            .populate('employee', 'name email')
            .sort({ date: -1, startTime: -1 })
            .limit(100);

        res.json(workLogs);
    } catch (error) {
        console.error('Error fetching team lead work logs:', error);
        res.status(500).json({ message: "Failed to fetch work logs" });
    }
};

export const getTeamLeadWorkLogStats = async (req, res) => {
    try {
        const teamLeadId = req.user.id;
        const team = await Team.findOne({ lead: teamLeadId });

        const memberIds = team ? [...team.members, teamLeadId] : [teamLeadId];

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
        console.error('Error fetching team lead work log stats:', error);
        res.status(500).json({ message: "Failed to fetch work log stats" });
    }
};

import { computeTeamAnalysis } from '../../utils/worksheet/analysisEngine.js';

export const getTeamLeadWorkLogAnalysis = async (req, res) => {
    try {
        const teamLeadId = req.user.id;
        const { fromDate, toDate } = req.query;
        const today = new Date().toISOString().slice(0, 10);
        const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = toDate || today;

        const team = await Team.findOne({ lead: teamLeadId });
        const memberIds = team ? [...team.members, teamLeadId] : [teamLeadId];

        const analysis = await computeTeamAnalysis(memberIds, from, to);
        res.json({ fromDate: from, toDate: to, ...analysis });
    } catch (error) {
        console.error('Error fetching team lead work log analysis:', error);
        res.status(500).json({ message: "Failed to fetch work log analysis" });
    }
};
