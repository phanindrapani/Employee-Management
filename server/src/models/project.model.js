import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'on-hold', 'cancelled'],
        default: 'upcoming'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    progressMode: {
        type: String,
        enum: ['auto', 'manual'],
        default: 'auto'
    },
    lastCalculatedAt: { type: Date },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
