import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import { calculateWorkingDays } from '../../utils/leaveCalculator.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import Notification from '../../models/notification.model.js';
import { getIO } from '../../socket.js';
import { sendEmail } from '../../utils/mailHelper.js';

export const applyLeave = async (req, res) => {
    try {
        const { leaveType, fromDate, toDate, session, reason } = req.body;
        const userId = req.user._id;

        if (!leaveType || !fromDate || !toDate || !reason) {
            return res.status(400).json({ message: 'All fields are required (leaveType, fromDate, toDate, reason)' });
        }

        if (new Date(toDate) < new Date(fromDate)) {
            return res.status(400).json({ message: 'To date cannot be before From date' });
        }

    if (new Date(fromDate) < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({ message: 'Cannot apply leave for past dates' });
    }

    const totalDays = await calculateWorkingDays(fromDate, toDate, session);

    if (totalDays === 0) {
        return res.status(400).json({ message: 'Selected duration has no working days (Sundays/Holidays)' });
    }

    const user = await User.findById(userId).lean();
    const balanceKey = leaveType.toLowerCase();

    if (balanceKey !== 'lop' && user.leaveBalance[balanceKey] < totalDays) {
        return res.status(400).json({ message: `Insufficient ${leaveType} balance` });
    }

    let attachmentUrl = undefined;
    if (req.file) {
        // Attachment upload is kept in-line as it's part of the leave record creation
        attachmentUrl = await uploadBufferToCloudinary(req.file, 'leave_attachments');
    }
    
    let approverId = user.reportingManager;
    if (!approverId || approverId.toString() === userId.toString()) {
        const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
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

    // Offload notifications and emails to setImmediate
    setImmediate(async () => {
        try {
            const io = getIO();
            const populatedLeave = await Leave.findById(leave._id)
                .populate('user', 'name email department role profilePicture')
                .lean();
            
            const notifications = [];

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

                // Bypass email sending during performance testing
                if (process.env.SKIP_EMAILS !== 'true' && process.env.SKIP_EMAILS !== true) {
                    try {
                        const approver = await User.findById(approverId).select('email name role').lean();
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
            }
        } catch (e) { 
            console.error('Background task error (applyLeave):', e.message); 
        }
    });

    res.status(201).json(leave);
    } catch (error) {
        console.error('Error in applyLeave:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyLeaves = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const leaves = await Leave.find({ user: req.user._id })
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('leaveType fromDate toDate totalDays status appliedAt session reason')
            .lean();

        const total = await Leave.countDocuments({ user: req.user._id });

        res.json({
            leaves,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leaves" });
    }
};

export const calculateLeave = async (req, res) => {
    try {
        const { fromDate, toDate, session } = req.body;

    if (!fromDate || !toDate) {
        return res.status(400).json({ message: 'From date and To date are required' });
    }

    if (new Date(toDate) < new Date(fromDate)) {
        return res.status(400).json({ message: 'To date cannot be before From date' });
    }

    const totalDays = await calculateWorkingDays(fromDate, toDate, session);
    res.json({ totalDays });
    } catch (error) {
        console.error('Error in calculateLeave:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
