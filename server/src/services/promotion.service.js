import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { getLeaveQuotas } from './settings.service.js';


export const promoteUser = async (id, targetRole, session = null) => {

    const localSession = session || await mongoose.startSession();
    if (!session) localSession.startTransaction();

    try {
        const user = await User.findById(id).session(localSession);
        if (!user) throw new Error('User not found');

        const currentRole = user.role;

        if (currentRole === 'admin' || targetRole === 'admin') {
            throw new Error('Admin role management must be handled separately');
        }

        if (currentRole === targetRole) {

            if (!session) {
                await localSession.commitTransaction();
                localSession.endSession();
            }
            return user;
        }

        let update = { role: targetRole };
        let unset = {};

        if (targetRole === 'manager') {
            update = {
                ...update,
                managementLevel: 'Junior'
            };
            unset = {
                experienceLevel: "",
                leadershipLevel: "",
                teamPerformanceScore: ""
            };
        }

        else if (targetRole === 'team-lead') {
            update = {
                ...update,
                leadershipLevel: 'Junior', // Default
                teamPerformanceScore: 0
            };
            unset = {
                experienceLevel: "",
                managementLevel: ""
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

        else if (targetRole === 'employee') {
            const quotas = await getLeaveQuotas();
            update = {
                ...update,
                leaveBalance: user.leaveBalance || quotas,
                experienceLevel: user.experienceLevel || 'Junior'
            };
            unset = {
                leadershipLevel: "",
                teamPerformanceScore: "",
                managementLevel: ""
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

        if (!session) {
            await localSession.commitTransaction();
            localSession.endSession();
        }

        return updatedUser;

    } catch (error) {

        if (!session) {
            await localSession.abortTransaction();
            localSession.endSession();
        }
        throw error;
    }
};
