import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ==================================================
// BASE OPTIONS
// ==================================================
const baseOptions = {
    discriminatorKey: 'role', // Defines the field that distinguishes roles
    collection: 'users',      // Stores all roles in a single 'users' collection
    timestamps: true
};

// ==================================================
// BASE USER SCHEMA (Common Fields)
// ==================================================
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    qualification: {
        type: String,
        default: ''
    }
}, baseOptions);

// ==================================================
// MIDDLEWARE & METHODS
// ==================================================

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Base Model
const User = mongoose.model('User', userSchema);

// ==================================================
// DISCRIMINATORS (Role-Specific Schemas)
// ==================================================

// 1️⃣ ADMIN DISCRIMINATOR
const Admin = User.discriminator('admin', new mongoose.Schema({
    permissions: [{
        type: String
    }],
    systemAccessLevel: {
        type: String,
        enum: ['full', 'restricted', 'viewer'],
        default: 'full'
    }
}));

// 2️⃣ TEAM LEAD DISCRIMINATOR
const TeamLead = User.discriminator('team-lead', new mongoose.Schema({
    skills: [{
        type: String
    }],
    leadershipLevel: {
        type: String,
        enum: ['Junior', 'Mid', 'Senior'],
        default: 'Junior'
    },
    teamPerformanceScore: {
        type: Number,
        default: 0
    }
}));

// 3️⃣ EMPLOYEE DISCRIMINATOR
const Employee = User.discriminator('employee', new mongoose.Schema({
    leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        earned: { type: Number, default: 15 }
    },
    skills: [{
        type: String
    }],
    experienceLevel: {
        type: String,
        enum: ['Junior', 'Mid', 'Senior', 'Intern'],
        default: 'Junior'
    }
}));

// ==================================================
// EXPORTS
// ==================================================
export { User, Admin, TeamLead, Employee };
export default User;
