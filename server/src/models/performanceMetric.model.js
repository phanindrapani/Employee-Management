import mongoose from 'mongoose';

const performanceMetricSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true }, // Format: "YYYY-MM"

    // Raw Metrics
    tasksAssigned: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    onTimeTasks: { type: Number, default: 0 },
    attendanceDays: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },

    // Scores (0-100)
    taskCompletionScore: { type: Number, default: 0 },
    onTimeScore: { type: Number, default: 0 },
    attendanceScore: { type: Number, default: 0 },
    teamContributionScore: { type: Number, default: 0 }, // Manual/Manager input

    // Final Weighted Score
    totalScore: { type: Number, default: 0 },

    category: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
        default: 'Average'
    }
}, { timestamps: true });

// Ensure one metric record per user per period
performanceMetricSchema.index({ user: 1, period: 1 }, { unique: true });

const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema);
export default PerformanceMetric;
