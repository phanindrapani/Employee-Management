import User from '../models/user.model.js';
import Leave from '../models/leave.model.js';
import Holiday from '../models/holiday.model.js';
import Department from '../models/department.model.js';
import Team from '../models/team.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryHelper.js';

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Basic Counts
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
        const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
        const todaysHolidays = await Holiday.countDocuments({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // 2. Monthly Leave Trend (Current Year)
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const monthlyLeaves = await Leave.aggregate([
            {
                $match: {
                    appliedAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: "$appliedAt" }, // 1-12
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Initialize array with 0s for all 12 months
        const monthlyTrend = Array(12).fill(0);
        monthlyLeaves.forEach(item => {
            monthlyTrend[item._id - 1] = item.count;
        });

        // 3. Leave Type Distribution
        const leaveDistribution = await Leave.aggregate([
            {
                $group: {
                    _id: "$leaveType", // CL, SL, EL, LOP
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate percentages
        const totalLeaves = leaveDistribution.reduce((acc, curr) => acc + curr.count, 0);
        const distribution = leaveDistribution.map(item => ({
            label: item._id,
            count: totalLeaves > 0 ? Math.round((item.count / totalLeaves) * 100) : 0,
            value: item.count // Keep raw count just in case
        }));

        // Map simplified labels if needed (e.g. UPPERCASE)
        // detailed mapping can be done on frontend or here

        res.json({
            stats: {
                totalEmployees,
                pendingLeaves,
                approvedLeaves,
                todaysHolidays
            },
            monthlyTrend,
            distribution
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};

export const getReportStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const approvedLeaves = await Leave.find({ status: 'approved' });
        const allEmployees = await User.find({ role: 'employee' }).select('name _id');

        // 1. Summary Metrics
        const totalLeavesCount = approvedLeaves.length;

        let totalDays = 0;
        const typeCounts = {};

        approvedLeaves.forEach(leave => {
            totalDays += leave.totalDays;
            typeCounts[leave.leaveType] = (typeCounts[leave.leaveType] || 0) + 1;
        });

        const avgDuration = totalLeavesCount > 0 ? (totalDays / totalLeavesCount).toFixed(1) : 0;

        let mostCommonType = 'N/A';
        let maxCount = 0;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) {
                mostCommonType = type;
                maxCount = count;
            }
        }

        const totalQuota = allEmployees.length * 24; // Assuming 24 days yearly quota
        const utilizationRate = totalQuota > 0 ? ((totalDays / totalQuota) * 100).toFixed(1) : 0;


        // 2. Monthly Data (Recalculate or reuse aggregate)
        const monthlyLeaves = await Leave.aggregate([
            {
                $match: {
                    status: 'approved',
                    appliedAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            { $group: { _id: { $month: "$appliedAt" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        const monthlyData = Array(12).fill(0);
        monthlyLeaves.forEach(item => monthlyData[item._id - 1] = item.count);


        // 3. Employee Stats
        // We need to group leaves by user and sum totalDays
        const empStatsMap = {};
        allEmployees.forEach(emp => {
            empStatsMap[emp._id.toString()] = { name: emp.name, leaves: 0, days: 0 };
        });

        approvedLeaves.forEach(leave => {
            const uid = leave.user.toString();
            if (empStatsMap[uid]) {
                empStatsMap[uid].leaves += 1;
                empStatsMap[uid].days += leave.totalDays;
            }
        });

        const employeeStats = Object.values(empStatsMap)
            .sort((a, b) => b.days - a.days)
            .slice(0, 5);

        res.json({
            summary: {
                totalLeaves: totalLeavesCount,
                avgDuration,
                mostCommonType,
                utilizationRate
            },
            monthlyData,
            employeeStats
        });

    } catch (error) {
        console.error("Report Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch report stats" });
    }
};

// Employee Management
export const createEmployee = async (req, res) => {
    try {
        const { name, email, role, department, reportingManager, skills, experienceLevel } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Employee already exists with this email" });
        }

        // Generate default password: firstname + 123
        const firstName = name.split(' ')[0].toLowerCase();
        const defaultPassword = `${firstName}123`;

        // Handle File Uploads
        const documents = {};
        const files = req.files || {};

        const fileFields = [
            'profilePicture', 'tenthMarksheet', 'intermediateMarksheet',
            'graduationCertificate', 'offerLetter', 'joiningLetter', 'resume'
        ];

        for (const field of fileFields) {
            if (files[field] && files[field][0]) {
                const url = await uploadBufferToCloudinary(files[field][0], firstName);
                if (field === 'profilePicture') {
                    // profilePicture is at top level in schema
                } else {
                    documents[field] = url;
                }
            }
        }

        const parseSkills = (skillsData) => {
            if (!skillsData) return [];
            try {
                return JSON.parse(skillsData);
            } catch (e) {
                return skillsData.split(',').map(s => s.trim());
            }
        };

        const newUser = await User.create({
            name,
            email,
            password: defaultPassword,
            role: role || 'employee',
            department,
            reportingManager,
            skills: parseSkills(skills),
            experienceLevel,
            profilePicture: files['profilePicture'] ? await uploadBufferToCloudinary(files['profilePicture'][0], firstName) : null,
            documents
        });

        res.status(201).json({
            message: "Employee created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                password: defaultPassword // Return for admin visibility
            }
        });

    } catch (error) {
        console.error("Create Employee error:", error);
        res.status(500).json({ message: error.message || "Failed to create employee" });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: { $ne: 'admin' } })
            .populate('reportingManager', 'name email')
            .sort({ createdAt: -1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch employees" });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Employee not found" });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Employee removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete employee" });
    }
};

// Department Management
export const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        const dept = await Department.create({ name, description, createdBy: req.user._id });
        res.status(201).json(dept);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create department" });
    }
};

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch departments" });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: "Department deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete department" });
    }
};

// Team Management
export const createTeam = async (req, res) => {
    try {
        const { name, department, teamLead } = req.body;
        const team = await Team.create({ name, department, teamLead });

        // If team lead is assigned, update user role to team-lead if it's currently employee
        if (teamLead) {
            await User.findByIdAndUpdate(teamLead, { role: 'team-lead', team: team._id });
        }

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create team" });
    }
};

export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('department').populate('teamLead', 'name email');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teams" });
    }
};

export const manageTeamMembers = async (req, res) => {
    try {
        const { teamId, memberId, action } = req.body; // action: 'add' or 'remove'
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (action === 'add') {
            if (!team.members.includes(memberId)) {
                team.members.push(memberId);
                await User.findByIdAndUpdate(memberId, { team: teamId });
            }
        } else {
            team.members = team.members.filter(m => m.toString() !== memberId);
            await User.findByIdAndUpdate(memberId, { team: null });
        }

        await team.save();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: "Failed to manage team members" });
    }
};

export const deleteTeam = async (req, res) => {
    try {
        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: "Team deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete team" });
    }
};

// Project Management
export const createProject = async (req, res) => {
    try {
        const { name, description, priority, startDate, endDate, assignedTeam } = req.body;
        const project = await Project.create({
            name,
            description,
            priority,
            startDate,
            endDate,
            assignedTeam,
            createdBy: req.user._id
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create project" });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate({
                path: 'assignedTeam',
                populate: { path: 'department' }
            })
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

export const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;
        const project = await Project.findByIdAndUpdate(id, { status, progress }, { new: true });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: "Failed to update project" });
    }
};

export const deleteProject = async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        // Also delete associated tasks? Usually yes for cleanup
        await Task.deleteMany({ project: req.params.id });
        res.json({ message: "Project and associated tasks deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete project" });
    }
};

// Holiday Management
export const createHoliday = async (req, res) => {
    try {
        const { name, date, type, description } = req.body;
        const holiday = await Holiday.create({ name, date, type, description });
        res.status(201).json(holiday);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create holiday" });
    }
};

export const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch holidays" });
    }
};

export const deleteHoliday = async (req, res) => {
    try {
        await Holiday.findByIdAndDelete(req.params.id);
        res.json({ message: "Holiday deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete holiday" });
    }
};

// Leave Management
export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('user', 'name email department role')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leaves" });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            id,
            { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined },
            { new: true }
        );

        // Logic to deduct leave balance if approved could go here or in a separate hook
        // For now complex balance logic is omitted, but can be added later

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: "Failed to update leave status" });
    }
};
