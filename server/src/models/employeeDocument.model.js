import mongoose from 'mongoose';

const employeeDocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['education', 'employment', 'identity', 'other'],
        required: true
    },
    documentName: {
        type: String, // e.g., "10th Marksheet", "Resume"
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    originalName: {
        type: String // The original filename uploaded
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    }
}, { timestamps: true });

const EmployeeDocument = mongoose.model('EmployeeDocument', employeeDocumentSchema);

export default EmployeeDocument;
