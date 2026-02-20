import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { getLeaveQuotas } from './settings.service.js';

/**
 * Promotes or Demotes a user with Transaction support.
 * @param {string} id - User ID
 * @param {string} targetRole - 'employee' | 'team-lead'
 * @param {mongoose.ClientSession} session - Optional mongoose session
 * @returns {Promise<Object>} Updated User
 */
export const promoteUser = async (id, targetRole, session = null) => {

    // If no external session is provided, start a new one for atomicity of this operation
    const localSession = session || await mongoose.startSession();
    if (!session) localSession.startTransaction();

    try {
        const user = await User.findById(id).session(localSession);
        if (!user) throw new Error('User not found');

        const currentRole = user.role;


        // Security: Prevent Admin manipulation via this service (Admins have separate flows)
        if (currentRole === 'admin' || targetRole === 'admin') {
            throw new Error('Admin role management must be handled separately');
        }

        // Idempotency: If already in role, just return user (or throw if strictness required, but better to be idempotent)
        if (currentRole === targetRole) {

            if (!session) {
                await localSession.commitTransaction();
                localSession.endSession();
            }
            return user;
        }

        let update = { role: targetRole };
        let unset = {};

        // CASE 1: Promoting Employee -> Team Lead
        if (targetRole === 'team-lead') {
            update = {
                ...update,
                leadershipLevel: 'Junior', // Default
                teamPerformanceScore: 0
            };
            unset = {
                experienceLevel: ""
            };
            if (user.team) {
                const Team = mongoose.model('Team');
                await Team.updateOne(
                    { _id: user.team },
                    { $pull: { members: user._id } },
                    { session: localSession }
                );

            }
        }

        // CASE 2: Demoting Team Lead -> Employee
        else if (targetRole === 'employee') {
            const quotas = await getLeaveQuotas();
            update = {
                ...update,
                leaveBalance: user.leaveBalance || quotas,
                experienceLevel: user.experienceLevel || 'Junior'
            };
            unset = {
                leadershipLevel: "",
                teamPerformanceScore: ""
            };
        }

        const result = await User.collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            {
                $set: update,
                $unset: unset
            },
            {
                session: localSession,
                returnDocument: 'after'
            }
        );
        const updatedUser = result.value || result;



        // Commit if we started the session
        if (!session) {
            await localSession.commitTransaction();
            localSession.endSession();
        }

        return updatedUser;

    } catch (error) {

        // Abort if we started the session
        if (!session) {
            await localSession.abortTransaction();
            localSession.endSession();
        }
        throw error;
    }
};
