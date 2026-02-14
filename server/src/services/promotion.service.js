import User from '../models/user.model.js';

/**
 * Service to handle safe role promotion/demotion between Employee and Team Lead
 */
export const promoteUser = async (id, targetRole) => {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const currentRole = user.role;

    // Prevent invalid role transitions (e.g., promoting an Admin or redundant changes)
    if (currentRole === 'admin' || targetRole === 'admin') {
        throw new Error('Admin role management must be handled separately for security');
    }
    if (currentRole === targetRole) {
        throw new Error(`User is already a ${targetRole}`);
    }

    let update = { role: targetRole };
    let unset = {};

    // Logic for Promoting Employee to Team Lead
    if (currentRole === 'employee' && targetRole === 'team-lead') {
        unset = {
            leaveBalance: "",
            experienceLevel: ""
        };
    }

    // Logic for Demoting Team Lead to Employee
    else if (currentRole === 'team-lead' && targetRole === 'employee') {
        unset = {
            leadershipLevel: "",
            teamPerformanceScore: ""
        };
        // Note: skills are kept since they exist in both roles
    }

    const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...update, $unset: unset },
        { new: true, runValidators: true }
    );

    return updatedUser;
};
