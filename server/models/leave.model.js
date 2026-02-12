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
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: { type: String },
    attachment: { type: String },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
