import User from '../models/user.model.js'; // Trigger restart
import Leave from '../models/leave.model.js';
import Holiday from '../models/holiday.model.js';
import Department from '../models/department.model.js';
import Team from '../models/team.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { promoteUser } from '../services/promotion.service.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryHelper.js';

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const nextTwoWeeks = new Date(today);
        nextTwoWeeks.setDate(today.getDate() + 14); // Expand to 14 days

        // 1. Organization Stats
        const totalEmployees = await User.countDocuments({ role: { $ne: 'admin' } });
        const totalDepartments = await Department.countDocuments();
        const totalTeams = await Team.countDocuments();

        // 2. Project Stats
        const projects = await Project.find();
        const projectStats = {
            total: projects.length,
            ongoing: projects.filter(p => p.status === 'ongoing').length,
            completed: projects.filter(p => p.status === 'completed').length,
            upcoming: projects.filter(p => p.status === 'upcoming' || p.status === 'planning').length,
            onHold: projects.filter(p => p.status === 'on-hold').length
        };

        // 3. Leave Stats
        const leaveStats = {
            pending: await Leave.countDocuments({ status: 'pending' }),
            approvedThisMonth: await Leave.countDocuments({
                status: 'approved',
                updatedAt: { $gte: firstDayOfMonth }
            }),
            rejectedThisMonth: await Leave.countDocuments({
                status: 'rejected',
                updatedAt: { $gte: firstDayOfMonth }
            })
        };

        // 4. Holiday Stats
        const holidayStats = {
            total: await Holiday.countDocuments({ date: { $gte: startOfYear } }),
            upcoming: await Holiday.findOne({ date: { $gte: today } }).sort({ date: 1 })
        };

        // 5. Pending Actions (Critical)
        const pendingLeavesRaw = await Leave.find({ status: 'pending' })
            .populate('user', 'name profilePicture')
            .limit(10)
            .sort({ appliedAt: -1 });

        const upcomingDeadlinesRaw = await Project.find({
            endDate: { $gte: today, $lte: nextTwoWeeks },
            status: { $ne: 'completed' }
        }).select('name endDate status assignedTeam').populate('assignedTeam', 'name').limit(10);

        // Filter out records where mandatory populated relations are null (e.g., deleted users)
        const pendingLeaves = pendingLeavesRaw.filter(l => l.user);
        const upcomingDeadlines = upcomingDeadlinesRaw;

        // 6. Team Performance Snapshot
        // Aggregate projects by team to calculate average progress
        const teams = await Team.find().populate('teamLead', 'name').lean();
        const teamPerformance = await Promise.all(teams.map(async (team) => {
            const teamProjects = await Project.find({ assignedTeam: team._id, status: 'ongoing' });
            const avgProgress = teamProjects.length > 0
                ? teamProjects.reduce((acc, curr) => acc + curr.progress, 0) / teamProjects.length
                : 0;

            return {
                _id: team._id,
                name: team.name,
                lead: team.teamLead?.name || 'Unassigned',
                activeProjects: teamProjects.length,
                members: team.members.length,
                avgProgress: Math.round(avgProgress)
            };
        }));

        // 7. Recent Activity Feed (Synthesized)
        // Fetch latest 5 from multiple collections and sort
        const recentLeaves = await Leave.find().sort({ updatedAt: -1 }).limit(5).populate('user', 'name');
        const recentProjects = await Project.find().sort({ updatedAt: -1 }).limit(5);
        const newEmployees = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(3);

        const activities = [
            ...recentLeaves.map(l => ({
                id: l._id,
                type: 'leave',
                message: `${l.user?.name || 'Unknown User'} leave request ${l.status}`,
                time: l.updatedAt
            })),
            ...recentProjects.map(p => ({
                id: p._id,
                type: 'project',
                message: `Project "${p.name}" updated to ${p.status}`,
                time: p.updatedAt
            })),
            ...newEmployees.map(u => ({
                id: u._id,
                type: 'employee',
                message: `New employee ${u.name} joined`,
                time: u.createdAt
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // 8. Monthly Leave Trend (Current Year)
        const currentYear = new Date().getFullYear();
        const startOfYearDate = new Date(currentYear, 0, 1);
        const endOfYearDate = new Date(currentYear, 11, 31);

        const monthlyLeaves = await Leave.aggregate([
            {
                $match: {
                    appliedAt: { $gte: startOfYearDate, $lte: endOfYearDate }
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

        // 9. Leave Type Distribution
        const leaveDistribution = await Leave.aggregate([
            {
                $group: {
                    _id: "$leaveType", // CL, SL, EL, LOP
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate percentages
        const totalLeavesCount = leaveDistribution.reduce((acc, curr) => acc + curr.count, 0);
        const distribution = leaveDistribution.map(item => ({
            label: item._id,
            count: totalLeavesCount > 0 ? Math.round((item.count / totalLeavesCount) * 100) : 0,
            value: item.count
        }));

        res.json({
            summary: {
                employees: totalEmployees,
                departments: totalDepartments,
                teams: totalTeams,
                projects: projectStats,
                leaves: leaveStats,
                holidays: holidayStats
            },
            pendingActions: {
                leaves: pendingLeaves,
                deadlines: upcomingDeadlines
            },
            teamPerformance,
            recentActivity: activities,
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
        const { name, email, phone, role, department, team, reportingManager, skills, experienceLevel } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Employee already exists with this email" });
        }

        // Generate default password: firstname + 123
        const firstName = name.split(' ')[0].toLowerCase();
        const defaultPassword = `${firstName}123`;

        // Handle File Uploads


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
            phone,
            password: defaultPassword,
            role: role || 'employee',
            department,
            team,
            reportingManager,
            skills: parseSkills(skills),
            experienceLevel,
            leaveBalance: {
                casual: req.body.casual ? parseInt(req.body.casual) : 12,
                sick: req.body.sick ? parseInt(req.body.sick) : 10,
                earned: req.body.earned ? parseInt(req.body.earned) : 15
            },
            qualification: req.body.qualification || ''
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

export const getEmployeeById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('reportingManager', 'name email')
            .populate('department', 'name');

        if (!user) return res.status(404).json({ message: "Employee not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch employee details" });
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

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, department, team, reportingManager, skills, experienceLevel, casual, sick, earned } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Employee not found" });

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (department) user.department = department;
        if (team !== undefined) user.team = team;
        if (reportingManager) user.reportingManager = reportingManager;
        if (experienceLevel) user.experienceLevel = experienceLevel;
        if (req.body.qualification) user.qualification = req.body.qualification;

        // Update leave balance if provided
        if (casual !== undefined || sick !== undefined || earned !== undefined) {
            user.leaveBalance = {
                casual: casual !== undefined ? parseInt(casual) : user.leaveBalance.casual,
                sick: sick !== undefined ? parseInt(sick) : user.leaveBalance.sick,
                earned: earned !== undefined ? parseInt(earned) : user.leaveBalance.earned
            };
        }

        if (skills) {
            try {
                user.skills = JSON.parse(skills);
            } catch (e) {
                user.skills = skills.split(',').map(s => s.trim());
            }
        }



        await user.save();
        res.json({ message: "Employee updated successfully", user });
    } catch (error) {
        console.error("Update Employee error:", error);
        res.status(500).json({ message: error.message || "Failed to update employee" });
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

export const updateDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );
        if (!dept) return res.status(404).json({ message: "Department not found" });
        res.json(dept);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update department" });
    }
};

// Team Management
export const createTeam = async (req, res) => {
    try {
        const { name, department, teamLead, members = [] } = req.body;
        const team = await Team.create({ name, department, teamLead, members });

        // If team lead is assigned, update user role to team-lead and set their team
        if (teamLead) {
            await User.findByIdAndUpdate(teamLead, {
                role: 'team-lead',
                team: team._id
            });
        }

        // Update all members to point to this team
        if (members.length > 0) {
            await User.updateMany(
                { _id: { $in: members } },
                { team: team._id }
            );
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
        const { id } = req.params;

        // Remove team reference from all users in this team
        await User.updateMany({ team: id }, { team: null });

        await Team.findByIdAndDelete(id);
        res.json({ message: "Team deleted and members updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete team" });
    }
};

export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, teamLead, members = [] } = req.body;

        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // If team lead is changing
        if (teamLead && team.teamLead?.toString() !== teamLead) {
            // Update new lead's role
            await User.findByIdAndUpdate(teamLead, {
                role: 'team-lead',
                team: id
            });
        }

        // Identify members to remove and members to add
        const oldMembers = team.members.map(m => m.toString());
        const newMembers = members.map(m => m.toString());

        const membersToRemove = oldMembers.filter(m => !newMembers.includes(m));
        const membersToAdd = newMembers.filter(m => !oldMembers.includes(m));

        if (membersToRemove.length > 0) {
            await User.updateMany({ _id: { $in: membersToRemove } }, { team: null });
        }
        if (membersToAdd.length > 0) {
            await User.updateMany({ _id: { $in: membersToAdd } }, { team: id });
        }

        team.name = name || team.name;
        team.department = department || team.department;
        team.teamLead = teamLead || team.teamLead;
        team.members = members;

        await team.save();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update team" });
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

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, priority, startDate, endDate, assignedTeam, status, progress } = req.body;

        const project = await Project.findByIdAndUpdate(
            id,
            { name, description, priority, startDate, endDate, assignedTeam, status, progress },
            { new: true, runValidators: true }
        );

        if (!project) return res.status(404).json({ message: "Project not found" });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update project" });
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

export const promoteUserAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const updatedUser = await promoteUser(id, role);

        res.json({
            message: `User promoted to ${role} successfully. User must re-login.`,
            user: updatedUser
        });
    } catch (error) {
        res.status(400).json({ message: error.message || "Promotion failed" });
    }
};
