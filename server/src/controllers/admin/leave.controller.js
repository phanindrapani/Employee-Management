import Leave from '../../models/leave.model.js';
import User from '../../models/user.model.js';
import mongoose from 'mongoose';
import { getIO } from '../../socket.js';

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('user', 'name email department role').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const updateLeaveStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { status, rejectionReason } = req.body;
        const leave = await Leave.findById(req.params.id).session(session);
        if (!leave) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const user = await User.findById(leave.user).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'User associated with this leave no longer exists' });
        }

        const nextStatus = status;
        const balanceKey = leave.leaveType?.toLowerCase();
        const wasBalanceApplied = leave.balanceApplied === true;
        const beforeBalance = balanceKey ? Number(user.leaveBalance?.[balanceKey] ?? 0) : null;
        console.log(`[DEBUG][AdminLeave] leave=${leave._id} user=${user._id} prevStatus=${leave.status} nextStatus=${nextStatus} type=${leave.leaveType} key=${balanceKey} totalDays=${leave.totalDays} wasApplied=${wasBalanceApplied} beforeBalance=${beforeBalance}`);

        // Debit only when approval is finalized and not yet applied.
        // Refund if moving away from approved after already applying.
        if (balanceKey && balanceKey !== 'lop') {
            const currentBalance = Number(user.leaveBalance?.[balanceKey] ?? 0);

            if (nextStatus === 'approved' && !wasBalanceApplied) {
                if (currentBalance < leave.totalDays) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: `Insufficient ${leave.leaveType} balance` });
                }
                user.leaveBalance[balanceKey] = currentBalance - leave.totalDays;
                await user.save({ session });
                leave.balanceApplied = true;
                console.log(`[DEBUG][AdminLeave] deducted leave=${leave._id} user=${user._id} key=${balanceKey} afterBalance=${user.leaveBalance[balanceKey]}`);
            } else if (nextStatus !== 'approved' && wasBalanceApplied) {
                user.leaveBalance[balanceKey] = currentBalance + leave.totalDays;
                await user.save({ session });
                leave.balanceApplied = false;
                console.log(`[DEBUG][AdminLeave] refunded leave=${leave._id} user=${user._id} key=${balanceKey} afterBalance=${user.leaveBalance[balanceKey]}`);
            }
        } else if (nextStatus === 'approved') {
            // LOP: no balance debit, but mark as handled.
            leave.balanceApplied = true;
            console.log(`[DEBUG][AdminLeave] LOP marked applied leave=${leave._id}`);
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
        await session.commitTransaction();

        const updatedLeave = await Leave.findById(leave._id).populate('user', 'name email department role');

        // Socket Emit
        try {
            const io = getIO();
            io.to('role:admin').emit('leave:updated', updatedLeave);
            io.to(`user:${updatedLeave.user._id}`).emit('leave:updated', updatedLeave);
            // Notify team lead?
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(updatedLeave);
    } catch (e) {
        await session.abortTransaction();
        res.status(500).json({ msg: "Failed" });
    } finally {
        session.endSession();
    }
};

export const reconcileLeaveBalances = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const staleApprovedLeaves = await Leave.find({
            status: 'approved',
            $or: [{ balanceApplied: { $exists: false } }, { balanceApplied: false }]
        }).session(session);

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

            const user = await User.findById(leave.user).session(session);
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
            await user.save({ session });

            await Leave.updateOne(
                { _id: leave._id },
                { $set: { balanceApplied: true } },
                { session, runValidators: false }
            );
            updatedLeaves += 1;
        }

        await session.commitTransaction();
        res.json({
            message: 'Leave balance reconciliation completed',
            updatedLeaves,
            skippedLeaves
        });
    } catch (e) {
        await session.abortTransaction();
        console.error('[ERROR][ReconcileLeaves]', e);
        res.status(500).json({ msg: 'Reconciliation failed', details: e.message });
    } finally {
        session.endSession();
    }
};
