import mongoose from 'mongoose';
import Counter from './counter.model.js';
import Project from './project.model.js';

const taskSchema = new mongoose.Schema({
    taskId: { type: String, unique: true, sparse: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'done'],
        default: 'todo'
    },
    deadline: { type: Date },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    weight: { type: Number, default: 1, min: 1 },
    completedAt: { type: Date }
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
    if (this.isNew && !this.taskId) {
        try {
            const project = await Project.findById(this.project);
            const prefix = project?.projectId || 'PRJ-UNK';

            const counter = await Counter.findOneAndUpdate(
                { model: `task_${this.project}` },
                { $inc: { count: 1 } },
                { new: true, upsert: true }
            );
            this.taskId = `${prefix}-TSK-${counter.count.toString().padStart(4, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
