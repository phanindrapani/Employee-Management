import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
        type: String,
        enum: ['CL', 'SL', 'EL', 'LOP'],
        required: true
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    session: {
        type: String,
        enum: ['full-day', 'half-morning', 'half-afternoon'],
        default: 'full-day'
    },
    totalDays: { type: Number, required: true },
    approver: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: { type: String },
    reason: { type: String, required: true },
    attachment: { type: String },
    // Tracks whether leave balance has already been applied for this request.
    balanceApplied: { type: Boolean, default: false },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
