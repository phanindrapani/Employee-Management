import Leave from '../models/leave.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { calculateWorkingDays } from '../utils/leaveCalculator.js';

export const applyLeave = async (req, res) => {
    const { leaveType, fromDate, toDate, session } = req.body;
    const userId = req.user._id;

    // 1. Basic validation
    if (new Date(toDate) < new Date(fromDate)) {
        return res.status(400).json({ message: 'To date cannot be before From date' });
    }

    if (new Date(fromDate) < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({ message: 'Cannot apply leave for past dates' });
    }

    // 2. Calculate working days
    const totalDays = await calculateWorkingDays(fromDate, toDate, session);

    if (totalDays === 0) {
        return res.status(400).json({ message: 'Selected duration has no working days (Sundays/Holidays)' });
    }

    // 3. Balance check
    const user = await User.findById(userId);
    const type = leaveType.toLowerCase();

    if (type !== 'lop' && user.leaveBalance[type] < totalDays) {
        return res.status(400).json({ message: `Insufficient ${leaveType} balance` });
    }

    // 4. Create leave request
    const leave = await Leave.create({
        user: userId,
        leaveType,
        fromDate,
        toDate,
        session,
        totalDays,
        status: 'pending'
    });

    res.status(201).json(leave);
};

export const getMyLeaves = async (req, res) => {
    const leaves = await Leave.find({ user: req.user._id }).sort({ appliedAt: -1 });
    res.json(leaves);
};

export const getAllLeaves = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const leaves = await Leave.find(filter).populate('user', 'name email role').sort({ appliedAt: -1 });
    res.json(leaves);
};

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

    leave.status = status;
    if (status === 'rejected') leave.rejectionReason = rejectionReason;

    await leave.save();

    // Deduct balance if approved
    if (status === 'approved') {
        const user = await User.findById(leave.user._id);
        const type = leave.leaveType.toLowerCase();
        if (type !== 'lop') {
            user.leaveBalance[type] -= leave.totalDays;
            await user.save();
        }
    }

    // Create notification
    await Notification.create({
        user: leave.user._id,
        message: `Your leave request for ${leave.totalDays} day(s) has been ${status}.`
    });

    res.json(leave);
};

export const calculateLeave = async (req, res) => {
    const { fromDate, toDate, session } = req.body;

    if (!fromDate || !toDate) {
        return res.status(400).json({ message: 'From date and To date are required' });
    }

    if (new Date(toDate) < new Date(fromDate)) {
        return res.status(400).json({ message: 'To date cannot be before From date' });
    }

    const totalDays = await calculateWorkingDays(fromDate, toDate, session);
    res.json({ totalDays });
};
