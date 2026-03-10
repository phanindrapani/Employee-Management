import mongoose from 'mongoose';

// ==================================================
// SLA Rules based on priority
// ==================================================
const SLA_HOURS = {
    CRITICAL: 4,
    HIGH: 24,
    MEDIUM: 72,    // 3 days
    LOW: 168       // 7 days
};

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['client', 'admin', 'manager', 'team-lead', 'employee'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isInternal: {
        type: Boolean,
        default: false   // internal = hidden from client
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const attachmentSchema = new mongoose.Schema({
    fileName: String,
    mimeType: String,
    size: Number,
    dataUrl: String      // base64 or file path
}, { _id: false });

const assignmentHistorySchema = new mongoose.Schema({
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    role: String,         // role that was assigned to
    note: String,
    assignedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const ticketSchema = new mongoose.Schema({
    ticketCode: {
        type: String,
        unique: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },

    category: {
        type: String,
        enum: ['BUG', 'FEATURE', 'SUPPORT', 'OTHER'],
        default: 'SUPPORT'
    },

    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },

    status: {
        type: String,
        enum: [
            'OPEN',
            'ASSIGNED',
            'IN_PROGRESS',
            'WAITING_FOR_CLIENT',
            'DOUBT_RAISED',
            'RESOLVED',
            'CLOSED',
            'REOPENED'
        ],
        default: 'OPEN'
    },

    assignedManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    assignedTeamLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    assignedEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    attachments: [attachmentSchema],

    comments: [commentSchema],

    assignmentHistory: [assignmentHistorySchema],

    resolutionNote: {
        type: String,
        default: null
    },
    doubtNote: {
        type: String,
        default: null
    },

    dueDate: {
        type: Date,
        default: null
    },

    slaBreached: {
        type: Boolean,
        default: false
    },

    resolvedAt: {
        type: Date,
        default: null
    },

    closedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

// ==================================================
// Pre-save hook: auto-generate ticketCode & dueDate
// ==================================================
ticketSchema.pre('save', async function (next) {
    // Auto-generate ticketCode on creation
    if (this.isNew) {
        try {
            const count = await this.constructor.countDocuments();
            this.ticketCode = `TKT-${String(1001 + count).padStart(4, '0')}`;

            // Set SLA due date based on priority
            const hours = SLA_HOURS[this.priority] || 72;
            this.dueDate = new Date(Date.now() + hours * 60 * 60 * 1000);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// ==================================================
// Indexes
// ==================================================
ticketSchema.index({ clientId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedManager: 1 });
ticketSchema.index({ assignedTeamLead: 1 });
ticketSchema.index({ assignedEmployee: 1 });
ticketSchema.index({ dueDate: 1, slaBreached: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
