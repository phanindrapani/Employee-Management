import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { uploadBufferToCloudinary } from '../utils/cloudinaryHelper.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

const calculateCompleteness = (user) => {
    const scoring = {
        essential: { score: 0, items: ['name', 'email', 'phone', 'department'] },
        professional: { score: 0, items: ['bio', 'skills', 'qualification', 'profilePicture'] },
        security: { score: 0, items: ['lastLogin', 'passwordSet'] }
    };

    let essentialCount = 0;
    scoring.essential.items.forEach(item => {
        if (user[item]) essentialCount++;
    });
    scoring.essential.score = (essentialCount / scoring.essential.items.length) * 40;

    let profCount = 0;
    if (user.bio && user.bio.length >= 20) profCount++;
    if (user.skills && user.skills.length > 0) profCount++;
    if (user.qualification) profCount++;
    if (user.profilePicture) profCount++;
    scoring.professional.score = (profCount / scoring.professional.items.length) * 40;

    let secCount = 0;
    if (user.lastLogin) secCount++;
    secCount++;
    scoring.security.score = (secCount / scoring.security.items.length) * 20;

    const totalScore = Math.min(100, Math.round(scoring.essential.score + scoring.professional.score + scoring.security.score));

    return {
        totalScore,
        breakdown: {
            essential: Math.round(scoring.essential.score),
            professional: Math.round(scoring.professional.score),
            security: Math.round(scoring.security.score)
        }
    };
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, company } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let clientCode = '';
        if (role === 'client') {
            const clientCount = await User.countDocuments({ role: 'client' });
            clientCode = `CLN-${1001 + clientCount}`;
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            company,
            clientCode
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company,
                clientCode: user.clientCode,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register User Error:", error);
        res.status(400).json({ 
            message: error.message || 'Validation failed',
            errors: error.errors 
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password))) {

            user.lastLogin = new Date();
            const populatedUser = await User.findById(user._id).populate('reportingManager', 'name');
            
            // Fallback for managers
            if (user.role === 'manager' && !populatedUser.reportingManager) {
                const admin = await User.findOne({ role: 'admin' }).select('name');
                if (admin) populatedUser.reportingManager = admin;
            }

            await user.save();

            res.json({
                _id: user._id,
                uid: user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                reportingManager: populatedUser.reportingManager,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('department', 'name')
            .populate('team', 'name')
            .populate('reportingManager', 'name profilePicture')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fallback for managers
        if (user.role === 'manager' && !user.reportingManager) {
            const admin = await User.findOne({ role: 'admin' }).select('name profilePicture');
            if (admin) user.reportingManager = admin;
        }

        const completeness = calculateCompleteness({ ...user, lastLogin: user.lastLogin || new Date() });


        res.json({
            ...user,
            completeness
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};


export const updateProfile = async (req, res) => {
    try {
        console.log("Updating profile for user:", req.user?._id);
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.bio = req.body.bio || user.bio;
            user.qualification = req.body.qualification || user.qualification;
            if (req.body.skills) user.skills = req.body.skills;

            if (req.file) {
                const firstName = user.name.split(' ')[0].toLowerCase();
                user.profilePicture = await uploadBufferToCloudinary(req.file, `profiles/${firstName}`);
            }

            const updatedUser = await user.save();
            const populatedUser = await User.findById(updatedUser._id).populate('reportingManager', 'name');
            
            // Fallback for managers
            if (updatedUser.role === 'manager' && !populatedUser.reportingManager) {
                const admin = await User.findOne({ role: 'admin' }).select('name');
                if (admin) populatedUser.reportingManager = admin;
            }

            const completeness = calculateCompleteness({ ...updatedUser.toObject(), lastLogin: updatedUser.lastLogin || new Date() });

            res.json({
                _id: updatedUser._id,
                uid: updatedUser.uid,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                leaveBalance: updatedUser.leaveBalance,
                profilePicture: updatedUser.profilePicture,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                qualification: updatedUser.qualification,
                createdAt: updatedUser.createdAt,
                reportingManager: populatedUser.reportingManager,
                completeness: completeness,
                token: generateToken(updatedUser._id, updatedUser.role),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update Profile Error (Full Error):", error);
        res.status(500).json({ message: error.message || "Failed to update profile", stack: error.stack });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: 'Server error during password change' });
    }
};
