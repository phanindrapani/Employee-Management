import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import connectDB from './src/config/db.js';

dotenv.config();

connectDB();

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        await User.create({
            name: 'System Admin',
            email: 'admin@ems.com',
            password: 'adminpassword', // Will be hashed by model pre-save hook
            role: 'admin',
            phone: '1234567890'
        });

        console.log('Admin user created successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
