import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    date: { type: Date, required: true, default: Date.now },
    hours: { type: Number, required: true, min: 0, max: 24 },
    description: { type: String, required: true }
}, { timestamps: true });

const WorkLog = mongoose.model('WorkLog', workLogSchema);
export default WorkLog;
