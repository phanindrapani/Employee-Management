import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { User, Admin, Manager, TeamLead, Employee } from '../models/user.model.js';
import Team from '../models/team.model.js';
import Department from '../models/department.model.js';

dotenv.config();

const seedManager = async () => {
    try {
        await connectDB();

        console.log('🔍 Finding Engineering Department...');
        const engDept = await Department.findOne({ name: 'Engineering' });
        if (!engDept) {
            console.log('❌ Engineering department not found. Please run main seeder first.');
            process.exit(1);
        }

        console.log('🌱 Creating Manager...');
        const managerEmail = 'manager@ems.com';
        let manager = await Manager.findOne({ email: managerEmail });

        if (!manager) {
            manager = await Manager.create({
                name: 'Robert Manager',
                email: managerEmail,
                phone: '8888888888',
                password: 'password123',
                role: 'manager',
                isActive: true,
                department: engDept._id,
                managementLevel: 'Senior',
                skills: ['Strategic Planning', 'People Management', 'Project Governance']
            });
            console.log('✅ Manager created:', manager.email);
        } else {
            console.log('ℹ️ Manager already exists:', manager.email);
        }

        console.log('🌍 Finding Engineering Teams...');
        const engTeams = await Team.find({ department: engDept._id });
        console.log(`📋 Found ${engTeams.length} teams.`);

        for (const team of engTeams) {
            console.log(`🔗 Updating Team: ${team.name}`);
            team.manager = manager._id;
            await team.save();

            if (team.teamLead) {
                console.log(`👤 Updating Team Lead reporting: ${team.teamLead}`);
                await User.findByIdAndUpdate(team.teamLead, { reportingManager: manager._id });
            }

            if (team.members && team.members.length > 0) {
                // Usually members report to TL, but let's ensure they have a manager path if needed
                // For now, we follow: Employee -> Team Lead -> Manager
            }
        }

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding manager:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedManager();
