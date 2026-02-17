import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';

export const getTeamLeaves = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const leaves = await Leave.find({ user: { $in: memberIds } })
            .populate('user', 'name profilePicture')
            .sort({ startDate: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team leaves" });
    }
};

// Copy of updateLeaveStatus but customized for Team Lead logic if needed,
// or generic enough. Handling TL approval.
export const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is mandatory' });
    }

    const leave = await Leave.findById(id).populate('user');
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (leave.status !== 'pending') {
        return res.status(400).json({ message: 'Leave request already processed' });
    }

    if (!leave.user) {
        return res.status(400).json({ message: 'User associated with this leave no longer exists' });
    }

    // Determine status for TL
    if (status === 'approved') {
        leave.status = 'tl-approved';
    } else {
        leave.status = status; // rejected
    }

    if (status === 'rejected') leave.rejectionReason = rejectionReason;

    await leave.save();

    // Notification
    const notificationMessage = `Your leave request for ${leave.totalDays} day(s) has been ${status === 'approved' ? 'approved by Team Lead' : status}.`;
    await Notification.create({
        user: leave.user._id,
        message: notificationMessage
    });

    // Socket Emit
    try {
        const io = getIO();
        io.to(`user:${leave.user._id}`).emit('leave:updated', leave);
        io.to(`user:${leave.user._id}`).emit('notification:new', { message: notificationMessage });
        io.to('role:admin').emit('leave:updated', leave); // Notify Admin that TL processed it (status: tl-approved or rejected)
    } catch (e) { console.error('Socket emit error:', e); }

    res.json(leave);
};
