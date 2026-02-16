import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

// Models
import { User, Admin, TeamLead, Employee } from '../models/user.model.js';
import Department from '../models/department.model.js';
import Team from '../models/team.model.js';
import Project from '../models/project.model.js';
import Leave from '../models/leave.model.js';
import Holiday from '../models/holiday.model.js';
import bcrypt from 'bcryptjs';
import { promoteUser } from '../services/promotion.service.js';
import { getLeaveQuotas } from '../services/settings.service.js';


dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Team.deleteMany({}),
            Project.deleteMany({}),
            Leave.deleteMany({}),
            Holiday.deleteMany({})
        ]);

        console.log('🌱 Seeding Departments...');
        const departments = await Department.create([
            { name: 'Engineering', description: 'Software Development and IT Operations' },
            { name: 'Human Resources', description: 'Recruitment and Employee Relations' },
            { name: 'Sales & Marketing', description: 'Sales pipeline and brand management' }
        ]);

        const engDept = departments[0];
        const hrDept = departments[1];

        console.log('🌱 Seeding Admin...');
        const admin = await Admin.create({
            name: 'System Admin',
            email: 'admin@ems.com',
            phone: '9999999999',
            password: 'adminpassword', // Will be hashed by hook
            role: 'admin',
            isActive: true,
            permissions: ['all'],
            systemAccessLevel: 'full',
            qualification: 'Master of Computer Applications (MCA)'
        });

        console.log('🌱 Seeding Teams...');
        // We create teams first without leads/members, then update them
        const teams = await Team.create([
            { name: 'Frontend Devs', department: engDept._id },
            { name: 'Backend Wizards', department: engDept._id },
            { name: 'Talent Acquisition', department: hrDept._id }
        ]);

        const feTeam = teams[0];
        const beTeam = teams[1];
        const hrTeam = teams[2];

        console.log('🌱 Seeding Employees (Initial leads)...');
        const quotas = await getLeaveQuotas();

        // Frontend TL (Created as Employee first)
        const SarahEmp = await Employee.create({
            name: 'Sarah Jenkins',
            email: 'sarah.tl@ems.com',
            phone: '9876543210',
            password: 'password123',
            role: 'employee',
            department: engDept._id,
            team: feTeam._id,
            reportingManager: admin._id,
            skills: ['React', 'Leadership', 'Agile'],
            experienceLevel: 'Senior',
            qualification: 'B.Tech in Computer Science',
            leaveBalance: quotas
        });

        // Backend TL (Created as Employee first)
        const MikeEmp = await Employee.create({
            name: 'Mike Ross',
            email: 'mike.tl@ems.com',
            phone: '9876543211',
            password: 'password123',
            role: 'employee',
            department: engDept._id,
            team: beTeam._id,
            reportingManager: admin._id,
            skills: ['Node.js', 'MongoDB', 'Architecture'],
            experienceLevel: 'Mid',
            qualification: 'M.Tech in Software Engineering',
            leaveBalance: quotas
        });

        console.log('🚀 Promoting Sarah and Mike to Team Leads...');
        const feLead = await promoteUser(SarahEmp._id, 'team-lead');
        const beLead = await promoteUser(MikeEmp._id, 'team-lead');

        // Fine-tune TL properties that might differ from defaults
        await User.findByIdAndUpdate(feLead._id, { leadershipLevel: 'Senior', teamPerformanceScore: 85 });
        await User.findByIdAndUpdate(beLead._id, { leadershipLevel: 'Mid', teamPerformanceScore: 90 });

        // Update Teams with Team Leads
        feTeam.teamLead = feLead._id;
        beTeam.teamLead = beLead._id;
        await feTeam.save();
        await beTeam.save();

        console.log('🌱 Seeding Employees...');
        const employees = await Employee.create([
            {
                name: 'John Doe',
                email: 'john.dev@ems.com',
                phone: '9876543220',
                password: 'password123',
                role: 'employee',
                department: engDept._id,
                team: feTeam._id,
                reportingManager: feLead._id,
                skills: ['HTML', 'CSS', 'React'],
                experienceLevel: 'Junior',
                leaveBalance: { cl: 10, sl: 10, el: 15 }, // Keep specific for testing
                qualification: 'B.E. in Information Technology'
            },
            {
                name: 'Jane Smith',
                email: 'jane.dev@ems.com',
                phone: '9876543221',
                password: 'password123',
                role: 'employee',
                department: engDept._id,
                team: feTeam._id,
                reportingManager: feLead._id,
                skills: ['Vue', 'Design'],
                experienceLevel: 'Mid',
                leaveBalance: { cl: 12, sl: 8, el: 10 }, // Keep specific for testing
                qualification: 'B.Des in Interaction Design'
            },
            {
                name: 'Robert Code',
                email: 'robert.be@ems.com',
                phone: '9876543222',
                password: 'password123',
                role: 'employee',
                department: engDept._id,
                team: beTeam._id,
                reportingManager: beLead._id,
                skills: ['Express', 'SQL'],
                experienceLevel: 'Senior',
                leaveBalance: { cl: 5, sl: 5, el: 20 }, // Keep specific for testing
                qualification: 'B.Tech in Computer Science'
            }
        ]);

        // Updates Teams with members
        feTeam.members.push(employees[0]._id, employees[1]._id);
        beTeam.members.push(employees[2]._id);
        await feTeam.save();
        await beTeam.save();

        const currentYear = new Date().getFullYear();

        console.log('🌱 Seeding Projects...');
        const projects = await Project.create([
            {
                name: 'Website Redesign',
                description: 'Overhauling the corporate website with new branding.',
                status: 'ongoing',
                priority: 'high',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-02-20'), // Next week from Feb 14
                assignedTeam: feTeam._id,
                progress: 45,
                createdBy: admin._id
            },
            {
                name: 'API Migration',
                description: 'Migrating legacy APIs to GraphQL.',
                status: 'upcoming',
                priority: 'medium',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-25'), // In 11 days
                assignedTeam: beTeam._id,
                progress: 0,
                createdBy: admin._id
            }
        ]);

        console.log('🌱 Seeding Holidays...');
        await Holiday.create([
            { name: 'Valentine\'s Break', date: new Date('2026-02-14'), type: 'public' },
            { name: 'Shivaratri', date: new Date('2026-02-26'), type: 'festival' },
            { name: 'Holi', date: new Date('2026-03-25'), type: 'festival' }
        ]);

        console.log('🌱 Seeding Leaves...');
        await Leave.create([
            {
                user: employees[0]._id,
                leaveType: 'CL',
                fromDate: new Date('2026-02-10'),
                toDate: new Date('2026-02-12'),
                totalDays: 3,
                status: 'approved',
                appliedAt: new Date('2026-02-05')
            },
            {
                user: employees[1]._id,
                leaveType: 'SL',
                fromDate: new Date('2026-02-15'),
                toDate: new Date('2026-02-15'),
                totalDays: 1,
                status: 'pending',
                appliedAt: new Date('2026-02-14') // Today
            }
        ]);

        console.log('✅ Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding data: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
};

seedData();