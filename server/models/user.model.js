import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const baseOptions = {
    discriminatorKey: 'role',
    timestamps: true
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        earned: { type: Number, default: 15 }
    },
    skills: [{ type: String }],
    experienceLevel: { type: String },
    isActive: { type: Boolean, default: true },
    profilePicture: { type: String },
    documents: {
        tenthMarksheet: { type: String },
        intermediateMarksheet: { type: String },
        graduationCertificate: { type: String },
        offerLetter: { type: String },
        joiningLetter: { type: String },
        resume: { type: String }
    }
}, baseOptions);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Discriminators for specific role logic if needed in future
const Admin = User.discriminator('admin', new mongoose.Schema({}));
const TeamLead = User.discriminator('team-lead', new mongoose.Schema({}));
const Employee = User.discriminator('employee', new mongoose.Schema({}));

export { User, Admin, TeamLead, Employee };
export default User;
