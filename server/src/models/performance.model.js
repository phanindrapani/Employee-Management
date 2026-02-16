import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewPeriod: { type: String, required: true }, // e.g., "Q1 2026"
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String },
    kpis: [{
        name: { type: String, required: true },
        score: { type: Number, min: 1, max: 10, required: true },
        comment: { type: String }
    }]
}, { timestamps: true });

const Performance = mongoose.model('Performance', performanceSchema);
export default Performance;
