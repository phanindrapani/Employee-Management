import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Milestone from '../models/milestone.model.js';

dotenv.config();

const reconcileMilestones = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const completedMilestones = await Milestone.find({
            status: 'completed',
            completedAt: { $exists: false }
        });

        console.log(`Found ${completedMilestones.length} milestones to reconcile`);

        for (const milestone of completedMilestones) {
            milestone.completedAt = milestone.updatedAt || milestone.createdAt;
            await milestone.save();
        }

        console.log('Reconciliation complete');
        process.exit(0);
    } catch (error) {
        console.error('Reconciliation failed:', error);
        process.exit(1);
    }
};

reconcileMilestones();
