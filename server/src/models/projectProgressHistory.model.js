import mongoose from 'mongoose';

const projectProgressHistorySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    oldProgress: { type: Number, required: true },
    newProgress: { type: Number, required: true },
    mode: {
        type: String,
        enum: ['auto', 'manual'],
        required: true
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ProjectProgressHistory = mongoose.model('ProjectProgressHistory', projectProgressHistorySchema);
export default ProjectProgressHistory;
