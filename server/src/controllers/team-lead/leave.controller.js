import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';
import mongoose from 'mongoose';
import { getIO } from '../../socket.js';

export const getTeamLeaves = async (req, res) => {
    try {
        const teamId = req.user.team;
        const members = await User.find({ team: teamId }).select('_id');
        const memberIds = members.map(m => m._id);

        const leaves = await Leave.find({ approver: req.user._id })
            .populate('user', 'name profilePicture department')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch team leaves" });
    }
};

export const updateLeaveStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (status === 'rejected' && !rejectionReason) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Rejection reason is mandatory' });
        }

        const leave = await Leave.findById(id).populate('user').session(session);
        if (!leave) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Leave request already processed' });
        }

        if (!leave.user) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'User associated with this leave no longer exists' });
        }

        // Handle Balance Debit on Approval
        if (status === 'approved') {
            const user = await User.findById(leave.user._id).session(session);
            const balanceKey = leave.leaveType?.toLowerCase();
            
            if (balanceKey && balanceKey !== 'lop') {
                const currentBalance = Number(user.leaveBalance?.[balanceKey] ?? 0);
                if (currentBalance < leave.totalDays) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: `Insufficient ${leave.leaveType} balance` });
                }
                user.leaveBalance[balanceKey] = currentBalance - leave.totalDays;
                await user.save({ session });
                leave.balanceApplied = true;
            } else if (balanceKey === 'lop') {
                leave.balanceApplied = true;
            }
            leave.status = 'approved';
        } else {
            leave.status = status; // rejected
            if (status === 'rejected') leave.rejectionReason = rejectionReason;
        }

        await leave.save({ session });
        await session.commitTransaction();

        // Notification & Socket logic remains outside transaction for better response time if they fail
        const notificationMessage = `Your leave request for ${leave.totalDays} day(s) has been ${status}.`;
        await Notification.create({
            user: leave.user._id,
            message: notificationMessage
        });

        try {
            const io = getIO();
            io.to(`user:${leave.user._id}`).emit('leave:updated', leave);
            io.to(`user:${leave.user._id}`).emit('notification:new', { message: notificationMessage });
            io.to('role:admin').emit('leave:updated', leave);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(leave);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to update leave status" });
    } finally {
        session.endSession();
    }
};
