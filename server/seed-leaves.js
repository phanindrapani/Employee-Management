import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Leave from './src/models/leave.model.js';
import User from './src/models/user.model.js';

async function seedLeaves() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const manager = await User.findOne({ email: 'manager@ems.com' });
        if (!manager) {
            console.error('Manager not found');
            process.exit(1);
        }

        const employees = await User.find({ role: 'employee' }).limit(10);
        if (employees.length === 0) {
            console.error('No employees found to create leaves for');
            process.exit(1);
        }

        const leaveTypes = ['CL', 'SL', 'EL'];
        const leaves = [];
        for (let i = 0; i < 50; i++) {
            const employee = employees[i % employees.length];
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() + 20 + i);
            const toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 2);

            leaves.push({
                user: employee._id,
                leaveType: leaveTypes[i % leaveTypes.length],
                fromDate: fromDate.toISOString().split('T')[0],
                toDate: toDate.toISOString().split('T')[0],
                totalDays: 3,
                reason: `Performance Test Leave ${i}`,
                status: 'pending',
                approver: manager._id,
                appliedAt: new Date()
            });
        }

        await Leave.insertMany(leaves);
        console.log(`Successfully seeded ${leaves.length} pending leaves for manager ${manager.email}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedLeaves();
