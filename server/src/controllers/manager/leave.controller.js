import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import Leave from '../../models/leave.model.js';

export const getManagerLeaves = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const memberIds = teams.reduce((acc, team) => {
            team.members.forEach(m => {
                if (!acc.includes(m.toString())) acc.push(m.toString());
            });
            return acc;
        }, []);

        const leaves = await Leave.find({ user: { $in: memberIds } })
            .populate('user', 'name email department')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leave requests" });
    }
};

export const getManagerLeaveStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const teams = await Team.find({ manager: managerId });
        const memberIds = teams.reduce((acc, team) => {
            team.members.forEach(m => {
                if (!acc.includes(m.toString())) acc.push(m.toString());
            });
            return acc;
        }, []);

        const stats = await Leave.aggregate([
            { $match: { user: { $in: memberIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leave stats" });
    }
};
