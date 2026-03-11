import mongoose from 'mongoose';
import Counter from './counter.model.js';

const departmentSchema = new mongoose.Schema({
    deptId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

departmentSchema.pre('save', async function (next) {
    if (this.isNew && !this.deptId) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { model: 'department' },
                { $inc: { count: 1 } },
                { new: true, upsert: true }
            );
            this.deptId = `DEPT-${counter.count.toString().padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;
