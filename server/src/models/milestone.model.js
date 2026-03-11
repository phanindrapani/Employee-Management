import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    milestoneId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    assignedTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    dueDate: {
        type: Date
    }
}, { timestamps: true });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
