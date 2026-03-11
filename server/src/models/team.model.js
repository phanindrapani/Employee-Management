import mongoose from 'mongoose';
import Counter from './counter.model.js';

const teamSchema = new mongoose.Schema({
    teamId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Ensure team names are unique within a department
teamSchema.index({ name: 1, department: 1 }, { unique: true });

teamSchema.pre('save', async function (next) {
    if (this.isNew && !this.teamId) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { model: 'team' },
                { $inc: { count: 1 } },
                { new: true, upsert: true }
            );
            this.teamId = `TEAM-${counter.count.toString().padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
