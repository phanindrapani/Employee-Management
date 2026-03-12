import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import { calculateWorkingDays } from '../../utils/leaveCalculator.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';
import { sendEmail } from '../../utils/mailHelper.js';

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

    // 5. Create leave request (with Admin fallback if no reporting manager)
    let approverId = user.reportingManager;
    if (!approverId || approverId.toString() === userId.toString()) {
        const admin = await User.findOne({ role: 'admin' });
        approverId = admin ? admin._id : null;
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
        approver: approverId,
        attachment: attachmentUrl
    });

    // Socket Emit
    try {
        const io = getIO();
        const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department role profilePicture');

        // --- NOTIFICATION: New Leave Request ---
        const notifications = [];

        // 1. Notify Reporting Manager (if exists)
        if (user.reportingManager) {
            notifications.push({
                user: user.reportingManager,
                message: `New Leave Request: ${req.user.name} applied for ${leaveType} (${totalDays} days)`,
                isRead: false
            });
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        if (approverId) {
            io.to(`user:${approverId}`).emit('leave:created', populatedLeave); 
            io.to(`user:${approverId}`).emit('notification', {
                message: `New Leave Request: ${req.user.name}`
            });

            // --- EMAIL NOTIFICATION ---
            try {
                const approver = await User.findById(approverId);
                if (approver && approver.email) {
                    const requesterRole = user.role === 'team-lead' ? 'Team Lead' : 'Employee';
                    let approverRole = 'Approver';
                    if (approver.role === 'admin') approverRole = 'Admin';
                    else if (approver.role === 'manager') approverRole = 'Manager';
                    else if (approver.role === 'team-lead') approverRole = 'Team Lead';

                    await sendEmail({
                        to: approver.email,
                        subject: `New Leave Request (${requesterRole}): ${user.name}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #0B3C5D;">
                                <h2 style="color: #63C132;">New Leave Request</h2>
                                <p><strong>From:</strong> ${user.name} (${requesterRole})</p>
                                <p><strong>Sent To:</strong> ${approver.name} (${approverRole})</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                                <p><strong>Type:</strong> ${leaveType}</p>
                                <p><strong>Duration:</strong> ${totalDays} days (${fromDate} to ${toDate})</p>
                                <p><strong>Reason:</strong> ${reason}</p>
                                <br/>
                                <p>Please log in to your portal to approve or reject this request.</p>
                            </div>
                        `
                    });
                }
            } catch (mailErr) {
                console.error('Failed to send leave request email:', mailErr);
            }
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
