import mongoose from 'mongoose';
import Team from '../../models/team.model.js';
import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';
import { calculateWorkingDays } from '../../utils/leaveCalculator.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

export const getManagerLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ approver: req.user._id })
            .populate('user', 'name email department role profilePicture')
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
            { $match: { approver: new mongoose.Types.ObjectId(req.user._id) } },
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

        // Only the assigned approver can process
        if (leave.approver.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ message: 'Not authorized to approve this leave' });
        }

        if (leave.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Leave request already processed' });
        }

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
            leave.status = status;
            if (status === 'rejected') leave.rejectionReason = rejectionReason;
        }

        await leave.save({ session });
        await session.commitTransaction();

        // Notification & Socket logic
        const notificationMessage = `Your leave request for ${leave.totalDays} day(s) has been ${status}.`;
        res.json(leave);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to update" });
    } finally {
        session.endSession();
    }
};

export const applyManagerLeave = async (req, res) => {
    const { leaveType, fromDate, toDate, session, reason } = req.body;
    const userId = req.user._id;

    if (new Date(toDate) < new Date(fromDate)) {
        return res.status(400).json({ message: 'To date cannot be before From date' });
    }

    if (new Date(fromDate) < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({ message: 'Cannot apply leave for past dates' });
    }

    const totalDays = await calculateWorkingDays(fromDate, toDate, session);

    if (totalDays === 0) {
        return res.status(400).json({ message: 'Selected duration has no working days' });
    }

    const user = await User.findById(userId);
    const balanceKey = leaveType.toLowerCase();

    if (balanceKey !== 'lop' && user.leaveBalance[balanceKey] < totalDays) {
        return res.status(400).json({ message: `Insufficient ${leaveType} balance` });
    }

    let attachmentUrl = undefined;
    if (req.file) {
        attachmentUrl = await uploadBufferToCloudinary(req.file, 'leave_attachments');
    }

    const leave = await Leave.create({
        user: userId,
        leaveType,
        fromDate,
        toDate,
        session,
        totalDays,
        reason,
        status: 'pending',
        approver: user.reportingManager,
        attachment: attachmentUrl
    });

    try {
        const io = getIO();
        const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department role profilePicture');

        const notifications = [];
        const admins = await User.find({ role: 'admin' });
        admins.forEach(admin => {
            notifications.push({
                user: admin._id,
                message: `New Leave Request: ${req.user.name} (Manager) applied for ${leaveType}`,
                isRead: false
            });
        });

        if (user.reportingManager) {
            notifications.push({
                user: user.reportingManager,
                message: `New Leave Request: ${req.user.name} applied for ${leaveType}`,
                isRead: false
            });
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        io.to('role:admin').emit('leave:created', populatedLeave);
        if (user.reportingManager) {
            io.to(`user:${user.reportingManager}`).emit('leave:created', populatedLeave);
        }
    } catch (e) { console.error('Socket error:', e); }

    res.status(201).json(leave);
};

export const getManagerMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ user: req.user._id }).sort({ appliedAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your leaves" });
    }
};

export const calculateManagerLeave = async (req, res) => {
    const { fromDate, toDate, session } = req.body;
    if (!fromDate || !toDate) return res.status(400).json({ message: 'Dates are required' });
    const totalDays = await calculateWorkingDays(fromDate, toDate, session);
    res.json({ totalDays });
};
