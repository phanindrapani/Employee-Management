import mongoose from 'mongoose';
import Counter from './counter.model.js';

const projectSchema = new mongoose.Schema({
    projectId: { type: String, unique: true, sparse: true },
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
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    progressMode: {
        type: String,
        enum: ['auto', 'manual'],
        default: 'auto'
    },
    lastCalculatedAt: { type: Date },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

projectSchema.pre('save', async function (next) {
    if (this.isNew && !this.projectId) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { model: 'project' },
                { $inc: { count: 1 } },
                { new: true, upsert: true }
            );
            this.projectId = `PRJ-${counter.count.toString().padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

projectSchema.index({ assignedTeams: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
