import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import { calculateWorkingDays } from '../../utils/leaveCalculator.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import { getIO } from '../../socket.js';

export const applyLeave = async (req, res) => {
    const { leaveType, fromDate, toDate, session, reason } = req.body;
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
    const balanceKey = leaveType.toLowerCase();

    if (balanceKey !== 'lop' && user.leaveBalance[balanceKey] < totalDays) {
        return res.status(400).json({ message: `Insufficient ${leaveType} balance` });
    }

    // 4. Handle attachment
    let attachmentUrl = undefined;
    if (req.file) {
        attachmentUrl = await uploadBufferToCloudinary(req.file, 'leave_attachments');
    }

    // 5. Create leave request
    const leave = await Leave.create({
        user: userId,
        leaveType,
        fromDate,
        toDate,
        session,
        totalDays,
        reason,
        status: 'pending',
        attachment: attachmentUrl
    });

    // Socket Emit
    try {
        const io = getIO();
        const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department role profilePicture');

        io.to('role:admin').emit('leave:created', populatedLeave); // Notify Admin
        if (user.reportingManager) {
            io.to(`user:${user.reportingManager}`).emit('leave:created', populatedLeave); // Notify Manager/TL
        }
    } catch (e) { console.error('Socket emit error:', e); }

    res.status(201).json(leave);
};

export const getMyLeaves = async (req, res) => {
    const leaves = await Leave.find({ user: req.user._id }).sort({ appliedAt: -1 });
    res.json(leaves);
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
