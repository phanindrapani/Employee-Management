import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import Milestone from '../models/milestone.model.js';
import PerformanceMetric from '../models/performanceMetric.model.js';

dotenv.config();

const debugPerformance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const manager = await User.findOne({ role: 'manager' });
        if (!manager) {
            console.log('No manager found');
            process.exit(0);
        }

        const userId = manager._id;
        console.log(`Checking performance for manager: ${manager.name} (${userId})`);

        const period = "2026-03";
        const [year, month] = period.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        console.log(`Period: ${period}, Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

        const projects = await Project.find({ managerId: userId });
        console.log(`Found ${projects.length} projects for this manager:`, projects.map(p => p.name));

        const projectIds = projects.map(p => p._id);

        const milestones = await Milestone.find({
            projectId: { $in: projectIds }
        });

        console.log(`Found ${milestones.length} total milestones for these projects.`);

        const relevantMilestones = milestones.filter(m => {
            const isCompletedBefore = m.status === 'completed' && m.completedAt && m.completedAt < startDate;
            return !isCompletedBefore;
        });

        console.log(`Found ${relevantMilestones.length} relevant milestones (not completed before this month).`);
        relevantMilestones.forEach(m => {
            console.log(`- Milestone: "${m.name}", Status: ${m.status}, completedAt: ${m.completedAt ? m.completedAt.toISOString() : 'N/A'}`);
        });

        const completedInPeriod = relevantMilestones.filter(m => m.status === 'completed' && m.completedAt && m.completedAt >= startDate && m.completedAt <= endDate);
        console.log(`Found ${completedInPeriod.length} milestones completed in this period.`);

        const milestonesAssigned = relevantMilestones.length;
        const { recalculatePerformanceForUser } = await import('../controllers/admin/performance.controller.js');
        const updatedMetric = await recalculatePerformanceForUser(userId, period);
        console.log('Recalculated PerformanceMetric record:', {
            tasksAssigned: updatedMetric.tasksAssigned,
            tasksCompleted: updatedMetric.tasksCompleted,
            totalScore: updatedMetric.totalScore,
            category: updatedMetric.category
        });

        const updatedUser = await User.findById(userId);
        console.log(`User individualPerformanceScore: ${updatedUser.individualPerformanceScore}`);

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
};

debugPerformance();
