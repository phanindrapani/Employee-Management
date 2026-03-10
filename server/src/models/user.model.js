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
        trim: true,
        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
        index: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit Indian mobile number!`
        },
        index: true
    },
    password: {
        type: String,
        required: true,
        select: false
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
    bio: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date
    },
    qualification: {
        type: String,
        default: ''
    },
    leaveBalance: {
        cl: { type: Number },
        sl: { type: Number },
        el: { type: Number }
    },
    documents: {
        tenth: { type: String },
        twelfth: { type: String },
        degree: { type: String },
        offerletter: { type: String },
        joiningletter: { type: String },
        resume: { type: String },
    },
    individualPerformanceScore: {
        type: Number,
        default: 0
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

// ADMIN DISCRIMINATOR
const Admin = User.discriminator('admin', new mongoose.Schema({}));


// MANAGER DISCRIMINATOR
const Manager = User.discriminator('manager', new mongoose.Schema({
    skills: [{
        type: String
    }],
    managementLevel: {
        type: String,
        enum: ['Junior', 'Mid', 'Senior'],
        default: 'Junior'
    }
}));


// TEAM LEAD DISCRIMINATOR
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

// EMPLOYEE DISCRIMINATOR
const Employee = User.discriminator('employee', new mongoose.Schema({
    skills: [{
        type: String
    }],
    experienceLevel: {
        type: String,
        enum: ['Junior', 'Mid', 'Senior', 'Intern'],
        default: 'Junior'
    }
}));

// CLIENT DISCRIMINATOR
const Client = User.discriminator('client', new mongoose.Schema({
    company: {
        type: String,
        default: ''
    },
    clientCode: {
        type: String,
        unique: true,
        sparse: true
    }
}));

// ==================================================
// EXPORTS
// ==================================================
export { User, Admin, Manager, TeamLead, Employee, Client };
export default User;
