import Leave from '../../models/leave.model.js';

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('user', 'name email department role').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined },
            { new: true }
        );
        res.json(leave);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
