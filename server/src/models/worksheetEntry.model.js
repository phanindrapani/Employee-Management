import mongoose from 'mongoose';

const worksheetEntrySchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: { type: String, required: true }, // ISO date string YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true },   // HH:MM
    durationMinutes: { type: Number, required: true, min: 1 },
    taskTitle: { type: String, required: true, trim: true },
    project: { type: String, default: '', trim: true },
    category: {
        type: String,
        enum: ['development', 'design', 'testing', 'meeting', 'documentation', 'research', 'support', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'blocked', 'pending'],
        default: 'completed'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    notes: { type: String, default: '' },
    tags: [{ type: String, trim: true }],

    // Import lineage
    sourceApp: { type: String, default: 'manual' }, // 'worksheet-app' | 'manual' | 'import'
    sourceFileName: { type: String, default: '' },
    sourceChecksum: { type: String, default: '' },
    importedAt: { type: Date },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Audit
    rawRow: { type: mongoose.Schema.Types.Mixed },
    validationFlags: [{ type: String }]
}, { timestamps: true });

// Compound indexes
worksheetEntrySchema.index({ employee: 1, date: 1 });
worksheetEntrySchema.index({ employee: 1, date: 1, startTime: 1, taskTitle: 1 }, { unique: true });

const WorksheetEntry = mongoose.model('WorksheetEntry', worksheetEntrySchema);
export default WorksheetEntry;
