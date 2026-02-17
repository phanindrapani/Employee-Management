import User from '../../models/user.model.js';
import Task from '../../models/task.model.js';
import Leave from '../../models/leave.model.js';

export const getTeamMembers = async (req, res) => {
    try {
        const teamId = req.user.team;

        // Fetch members with workload
        const members = await User.find({ team: teamId })
            .select('name email phone role experienceLevel skills profilePicture isActive');

        // Fetch team metadata for dynamic header
        const teamInfo = await User.findById(req.user._id)
            .populate({
                path: 'team',
                select: 'name'
            })
            .populate({
                path: 'department',
                select: 'name'
            });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const membersEnhanced = await Promise.all(members.map(async (member) => {
            const taskCount = await Task.countDocuments({
                assignedTo: member._id,
                status: { $in: ['todo', 'in-progress'] }
            });

            const isOnLeave = await Leave.exists({
                user: member._id,
                status: 'approved',
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            return {
                ...member.toObject(),
                activeTasks: taskCount,
                isOnLeave: !!isOnLeave
            };
        }));

        res.json({
            members: membersEnhanced,
            metadata: {
                teamName: teamInfo.team?.name || 'My Team',
                departmentName: teamInfo.department?.name || 'Human Resources'
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team members" });
    }
};
