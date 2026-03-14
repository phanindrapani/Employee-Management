import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import Team from '../../models/team.model.js';
import { promoteUser } from '../../services/promotion.service.js';
import { getIO } from '../../socket.js';
import { areTransactionsSupported } from '../../utils/dbUtils.js';

export const createTeam = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }

    try {
        const { name, department, teamLead, manager, members = [] } = req.body;

        // Create Team
        const createOptions = session ? { session } : {};
        const [team] = await Team.create([{ name, department, teamLead, manager, members }], createOptions);

        // Promote Lead (if assigned)
        if (teamLead) {
            await promoteUser(teamLead, 'team-lead', session);
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(teamLead) },
                { $set: { team: team._id, reportingManager: manager ? new mongoose.Types.ObjectId(manager) : null } },
                { session }
            );
        }

        // Promote Manager (if assigned)
        if (manager) {
            await promoteUser(manager, 'manager', session);
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(manager) },
                { $set: { reportingManager: null } },
                { session }
            );
        }

        // Update Members
        if (members.length > 0) {
            await User.updateMany(
                { _id: { $in: members } },
                {
                    $set: {
                        team: team._id,
                        reportingManager: teamLead ? new mongoose.Types.ObjectId(teamLead) : (manager ? new mongoose.Types.ObjectId(manager) : null)
                    }
                },
                { session }
            );
        }

        if (session) await session.commitTransaction();

        try {
            const io = getIO();
            const populatedTeam = await Team.findById(team._id).populate('department').populate('teamLead', 'name email').populate('manager', 'name email');
            io.to('role:admin').emit('team:created', populatedTeam);
            if (teamLead) io.to(`user:${teamLead}`).emit('team:assigned', populatedTeam);
            if (manager) io.to(`user:${manager}`).emit('team:assigned', populatedTeam);
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(team);
    } catch (error) {
        if (session) await session.abortTransaction();
        if (error?.code === 11000) {
            return res.status(400).json({ message: "Team name already exists in this department" });
        }
        res.status(500).json({ message: error.message || "Failed to create team" });
    } finally {
        if (session) session.endSession();
    }
}

export const updateTeam = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }

    try {
        const { id } = req.params;
        const { name, department, teamLead, manager, members = [] } = req.body;

        const teamQuery = Team.findById(id);
        if (session) teamQuery.session(session);
        const team = await teamQuery;
        if (!team) throw new Error("Team not found");

        const oldLeadId = team.teamLead ? team.teamLead.toString() : null;
        const newLeadId = teamLead || null;
        const oldManagerId = team.manager ? team.manager.toString() : null;
        const newManagerId = manager || null;

        // Handle Lead Swap
        if (newLeadId !== oldLeadId) {
            if (oldLeadId) {
                await promoteUser(oldLeadId, 'employee', session);
                await User.collection.updateOne(
                    { _id: new mongoose.Types.ObjectId(oldLeadId) },
                    { $set: { team: null, reportingManager: null } },
                    { session }
                );
            }
            if (newLeadId) {
                await promoteUser(newLeadId, 'team-lead', session);
                await User.collection.updateOne(
                    { _id: new mongoose.Types.ObjectId(newLeadId) },
                    { $set: { team: id } },
                    { session }
                );
            }
        }

        // Handle Manager Swap
        if (newManagerId !== oldManagerId) {
            if (oldManagerId) {

            }
            if (newManagerId) {
                await promoteUser(newManagerId, 'manager', session);
                await User.collection.updateOne(
                    { _id: new mongoose.Types.ObjectId(newManagerId) },
                    { $set: { reportingManager: null } },
                    { session }
                );
            }
        }

        // Update Members
        try {
            const oldMembers = team.members.map(m => m.toString());
            const newMembers = members.map(m => m.toString());
            const membersToRemove = oldMembers.filter(m => !newMembers.includes(m));

            if (membersToRemove.length > 0) {
                await User.updateMany(
                    { _id: { $in: membersToRemove } },
                    { $set: { team: null, reportingManager: null } },
                    { session }
                );
            }

            if (newMembers.length > 0) {
                await User.updateMany(
                    { _id: { $in: newMembers } },
                    {
                        $set: {
                            team: id,
                            ...(newLeadId ? { reportingManager: newLeadId } : { reportingManager: null })
                        }
                    },
                    { session }
                );
            }
        } catch (e) {
            throw e;
        }

        // Always sync reporting manager for current team members
        if (newLeadId) {
            await User.updateOne(
                { _id: newLeadId },
                { $set: { reportingManager: newManagerId ? new mongoose.Types.ObjectId(newManagerId) : null, team: id } },
                { session }
            );

            await User.updateMany(
                { team: id, _id: { $ne: newLeadId }, role: { $ne: 'manager' } },
                { $set: { reportingManager: newLeadId } },
                { session }
            );

        } else if (newManagerId) {
            await User.updateMany(
                { team: id, role: { $ne: 'manager' } },
                { $set: { reportingManager: newManagerId } },
                { session }
            );
        } else {
            await User.updateMany(
                { team: id },
                { $set: { reportingManager: null } },
                { session }
            );
        }

        // Update Team Doc
        try {
            await Team.findByIdAndUpdate(
                id,
                {
                    $set: {
                        name: name || team.name,
                        department: department || team.department,
                        teamLead: newLeadId,
                        manager: newManagerId,
                        members: members
                    }
                },
                { session, new: true, runValidators: false }
            );
        } catch (e) {
            throw e;
        }

        if (session) await session.commitTransaction();

        const updatedTeam = await Team.findById(id).populate('department').populate('teamLead', 'name email').populate('manager', 'name email');

        try {
            const io = getIO();
            io.to('role:admin').emit('team:updated', updatedTeam);
            io.to(`team:${id}`).emit('team:updated', updatedTeam);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(updatedTeam);
    } catch (error) {
        if (session) await session.abortTransaction();
        console.error("Update Team Transaction Error:", error);
        res.status(500).json({ message: error.message || "Failed to update team" });
    } finally {
        if (session) session.endSession();
    }
}

export const deleteTeam = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }
    try {
        const { id } = req.params;
        const teamQuery = Team.findById(id);
        if (session) teamQuery.session(session);
        const team = await teamQuery;

        if (team && team.teamLead) {
            await promoteUser(team.teamLead, 'employee', session);
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(team.teamLead) },
                { $set: { team: null } },
                { session }
            );
        }

        await User.updateMany({ team: id }, { team: null }, { session });
        await Team.findByIdAndDelete(id).session(session);

        if (session) await session.commitTransaction();

        try {
            const io = getIO();
            io.to('role:admin').emit('team:deleted', id);
            io.to(`team:${id}`).emit('team:deleted', id);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ message: "Team deleted" });
    } catch (error) {
        if (session) await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to delete team" });
    } finally {
        if (session) session.endSession();
    }
}

export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('department').populate('teamLead', 'name email').populate('manager', 'name email');
        res.json(teams);
    } catch (error) { res.status(500).json({ msg: "Failed to fetch" }); }
};

export const manageTeamMembers = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }
    try {
        const { teamId, memberId, action } = req.body;
        const teamQuery = Team.findById(teamId);
        if (session) teamQuery.session(session);
        const team = await teamQuery;
        if (!team) throw new Error("Team not found");

        if (action === 'add') {
            if (!team.members.includes(memberId)) {
                team.members.push(memberId);
                await User.findByIdAndUpdate(memberId, { team: teamId }, { session });
            }
        } else {
            team.members = team.members.filter(m => m.toString() !== memberId);
            await User.findByIdAndUpdate(memberId, { team: null }, { session });
        }

        await team.save({ session });
        if (session) await session.commitTransaction();
        res.json(team);
    } catch (error) {
        if (session) await session.abortTransaction();
        res.status(500).json({ message: "Failed to manage team members" });
    } finally { if (session) session.endSession(); }
}
