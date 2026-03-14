import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import mongoose from 'mongoose';
import { getIO } from '../../socket.js';
import { sendEmail } from '../../utils/mailHelper.js';
import { areTransactionsSupported } from '../../utils/dbUtils.js';

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({
            $or: [
                { approver: req.user._id },
                { 'user.role': 'manager' }
            ]
        })
            .populate({
                path: 'user',
                select: 'name email department role',
                match: { $or: [{ role: 'manager' }, { reportingManager: req.user._id }] }
            })
            .sort({ createdAt: -1 });

        const filteredLeaves = leaves.filter(l => l.user !== null);
        res.json(filteredLeaves);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const updateLeaveStatus = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }
    try {
        const { status, rejectionReason } = req.body;
        const leaveQuery = Leave.findById(req.params.id);
        if (session) leaveQuery.session(session);
        const leave = await leaveQuery;
        if (!leave) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const userQuery = User.findById(leave.user);
        if (session) userQuery.session(session);
        const user = await userQuery;
        if (!user) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ message: 'User associated with this leave no longer exists' });
        }

        const nextStatus = status;
        const balanceKey = leave.leaveType?.toLowerCase();
        const wasBalanceApplied = leave.balanceApplied === true;
        const beforeBalance = balanceKey ? Number(user.leaveBalance?.[balanceKey] ?? 0) : null;

        if (balanceKey && balanceKey !== 'lop') {
            const currentBalance = Number(user.leaveBalance?.[balanceKey] ?? 0);

            if (nextStatus === 'approved' && !wasBalanceApplied) {
                if (currentBalance < leave.totalDays) {
                    if (session) await session.abortTransaction();
                    return res.status(400).json({ message: `Insufficient ${leave.leaveType} balance` });
                }
                user.leaveBalance[balanceKey] = currentBalance - leave.totalDays;
                await user.save(session ? { session } : {});
                leave.balanceApplied = true;
            } else if (nextStatus !== 'approved' && wasBalanceApplied) {
                user.leaveBalance[balanceKey] = currentBalance + leave.totalDays;
                await user.save(session ? { session } : {});
                leave.balanceApplied = false;
            }
        } else if (nextStatus === 'approved') {
            leave.balanceApplied = true;
        } else if (nextStatus !== 'approved' && wasBalanceApplied) {
            leave.balanceApplied = false;
        }

        const leaveUpdate = {
            status: nextStatus,
            rejectionReason: nextStatus === 'rejected' ? rejectionReason : undefined,
            balanceApplied: leave.balanceApplied
        };
        await Leave.updateOne(
            { _id: leave._id },
            { $set: leaveUpdate },
            { session, runValidators: false }
        );
        if (session) await session.commitTransaction();

        const updatedLeave = await Leave.findById(leave._id).populate('user', 'name email department role');

        try {
            const io = getIO();

            if (updatedLeave.user && updatedLeave.user.role === 'manager') {
                io.to('role:admin').emit('leave:updated', updatedLeave);
            }

            io.to(`user:${updatedLeave.user._id}`).emit('leave:updated', updatedLeave);

            if (updatedLeave.user && updatedLeave.user.email) {
                await sendEmail({
                    to: updatedLeave.user.email,
                    subject: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #0B3C5D;">
                            <h2 style="color: ${status === 'approved' ? '#63C132' : '#F43F5E'}; text-transform: capitalize;">
                                Leave Request ${status}
                            </h2>
                            <p>Hi ${updatedLeave.user.name},</p>
                            <p>Your leave request for <strong>${updatedLeave.totalDays} day(s)</strong> has been <strong>${status}</strong> by the Administrator.</p>
                            ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                            <p>Please log in to your portal for more details.</p>
                        </div>
                    `
                });
            }
        } catch (e) { console.error('Notification/Socket error:', e); }

        res.json(updatedLeave);
    } catch (e) {
        if (session) await session.abortTransaction();
        console.error('[ERROR][UpdateLeaveStatus]', e);
        res.status(500).json({ msg: "Failed", error: e.message });
    } finally {
        if (session) session.endSession();
    }
};

export const reconcileLeaveBalances = async (req, res) => {
    let session = null;
    const supportsTransactions = await areTransactionsSupported();
    if (supportsTransactions) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) {
            session = null;
        }
    }
    try {
        const staleLeavesQuery = Leave.find({
            status: 'approved',
            $or: [{ balanceApplied: { $exists: false } }, { balanceApplied: false }]
        });
        if (session) staleLeavesQuery.session(session);
        const staleApprovedLeaves = await staleLeavesQuery;

        let updatedLeaves = 0;
        let skippedLeaves = 0;

        for (const leave of staleApprovedLeaves) {
            const balanceKey = leave.leaveType?.toLowerCase();

            if (balanceKey === 'lop') {
                await Leave.updateOne(
                    { _id: leave._id },
                    { $set: { balanceApplied: true } },
                    { session, runValidators: false }
                );
                updatedLeaves += 1;
                continue;
            }

            const userQuery = User.findById(leave.user);
            if (session) userQuery.session(session);
            const user = await userQuery;
            if (!user) {
                skippedLeaves += 1;
                continue;
            }

            const currentBalance = Number(user.leaveBalance?.[balanceKey] ?? 0);
            if (currentBalance < leave.totalDays) {
                skippedLeaves += 1;
                continue;
            }

            user.leaveBalance[balanceKey] = currentBalance - leave.totalDays;
            await user.save(session ? { session } : {});

            await Leave.updateOne(
                { _id: leave._id },
                { $set: { balanceApplied: true } },
                { session, runValidators: false }
            );
            updatedLeaves += 1;
        }

        if (session) await session.commitTransaction();
        res.json({
            message: 'Leave balance reconciliation completed',
            updatedLeaves,
            skippedLeaves
        });
    } catch (e) {
        if (session) await session.abortTransaction();
        console.error('[ERROR][ReconcileLeaves]', e);
        res.status(500).json({ msg: 'Reconciliation failed', details: e.message });
    } finally {
        if (session) session.endSession();
    }
};
