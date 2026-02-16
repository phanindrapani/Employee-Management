import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d', // Expire in 30 day as per requirement
    });
};

export const registerUser = async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        phone
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // We must explicitly select password because it's 'select: false' in schema
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
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

        console.log(`[DEBUG] Profile fetched for ${user.email}, Role: ${user.role}, Experience: ${user.experienceLevel}, Leadership: ${user.leadershipLevel}`);

        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

import { uploadBufferToCloudinary } from '../utils/cloudinaryHelper.js';

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;

            if (req.file) {
                const firstName = user.name.split(' ')[0].toLowerCase();
                user.profilePicture = await uploadBufferToCloudinary(req.file, `profiles/${firstName}`);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                leaveBalance: updatedUser.leaveBalance,
                profilePicture: updatedUser.profilePicture, // Add this
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: error.message || "Failed to update profile" });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id);

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
};
