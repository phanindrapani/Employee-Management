import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import Team from '../../models/team.model.js';
import { promoteUser } from '../../services/promotion.service.js';

// ==================================================
// TEAM MANAGEMENT (TRANSACTIONS)
// ==================================================

export const createTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, department, teamLead, members = [] } = req.body;

        // 1. Create Team
        const [team] = await Team.create([{ name, department, teamLead, members }], { session });

        // 2. Promote Lead (if assigned)
        if (teamLead) {
            console.log(`[DEBUG] createTeam: Promoting lead ${teamLead}`);
            await promoteUser(teamLead, 'team-lead', session);
            // Use native driver for consistency
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(teamLead) },
                { $set: { team: team._id, reportingManager: new mongoose.Types.ObjectId(teamLead) } },
                { session }
            );
        }

        // 3. Update Members
        if (members.length > 0) {
            await User.updateMany(
                { _id: { $in: members } },
                {
                    $set: {
                        team: team._id,
                        ...(teamLead ? { reportingManager: teamLead } : {})
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();
        res.status(201).json(team);
    } catch (error) {
        await session.abortTransaction();
        if (error?.code === 11000) {
            return res.status(400).json({ message: "Team name already exists in this department" });
        }
        res.status(500).json({ message: error.message || "Failed to create team" });
    } finally {
        session.endSession();
    }
};

export const updateTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { name, department, teamLead, members = [] } = req.body;

        const team = await Team.findById(id).session(session);
        if (!team) throw new Error("Team not found");

        const oldLeadId = team.teamLead ? team.teamLead.toString() : null;
        const newLeadId = teamLead || null;

        // 1. Handle Lead Swap
        if (newLeadId !== oldLeadId) {
            // Demote Old
            if (oldLeadId) {
                try {
                    await promoteUser(oldLeadId, 'employee', session);
                } catch (e) {
                    throw e;
                }

                try {
                    await User.collection.updateOne(
                        { _id: new mongoose.Types.ObjectId(oldLeadId) },
                        { $set: { team: null } },
                        { session }
                    );
                } catch (e) {
                    throw e;
                }
            }

            // Promote New
            if (newLeadId) {
                try {
                    await promoteUser(newLeadId, 'team-lead', session);
                } catch (e) {
                    throw e;
                }

                try {
                    await User.collection.updateOne(
                        { _id: new mongoose.Types.ObjectId(newLeadId) },
                        {
                            $set: {
                                team: id,
                                reportingManager: new mongoose.Types.ObjectId(newLeadId)
                            }
                        },
                        { session }
                    );
                } catch (e) {
                    throw e;
                }
            }
        }

        // 2. Update Members
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

        // Step 2b: Always sync reporting manager for current team members
        if (newLeadId) {
            try {
                // Non-leads report to the team lead
                await User.updateMany(
                    { team: id, _id: { $ne: newLeadId } },
                    { $set: { reportingManager: newLeadId } },
                    { session }
                );

                // Team lead reports to themselves
                await User.updateOne(
                    { _id: newLeadId },
                    { $set: { reportingManager: newLeadId, team: id } },
                    { session }
                );

            } catch (e) {
                throw e;
            }
        } else {
            await User.updateMany(
                { team: id },
                { $set: { reportingManager: null } },
                { session }
            );
        }

        // 3. Update Team Doc
        try {
            // Use findByIdAndUpdate to avoid validation conflicts with native driver updates
            await Team.findByIdAndUpdate(
                id,
                {
                    $set: {
                        name: name || team.name,
                        department: department || team.department,
                        teamLead: newLeadId,
                        members: members
                    }
                },
                { session, new: true, runValidators: false }
            );
        } catch (e) {
            throw e;
        }

        await session.commitTransaction();

        // Return updated team
        const updatedTeam = await Team.findById(id).populate('department').populate('teamLead', 'name email');
        res.json(updatedTeam);
    } catch (error) {
        await session.abortTransaction();
        console.error("Update Team Transaction Error:", error);
        res.status(500).json({ message: error.message || "Failed to update team" });
    } finally {
        session.endSession();
    }
};

export const deleteTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const team = await Team.findById(id).session(session);

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

        await session.commitTransaction();
        res.json({ message: "Team deleted" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to delete team" });
    } finally {
        session.endSession();
    }
};

export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('department').populate('teamLead', 'name email');
        res.json(teams);
    } catch (error) { res.status(500).json({ msg: "Failed to fetch" }); }
};

export const manageTeamMembers = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, memberId, action } = req.body;
        const team = await Team.findById(teamId).session(session);
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
        await session.commitTransaction();
        res.json(team);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to manage team members" });
    } finally { session.endSession(); }
};
