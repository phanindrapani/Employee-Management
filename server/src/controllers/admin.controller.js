import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Leave from '../models/leave.model.js';
import Holiday from '../models/holiday.model.js';
import Department from '../models/department.model.js';
import Team from '../models/team.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { promoteUser } from '../services/promotion.service.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryHelper.js';

// ==================================================
// DASHBOARD STATS (Aggregations)
// ==================================================
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // 1. Basic Counts and Parallel Aggregations
        const [
            totalEmployees,
            totalTeams,
            totalDepartments,
            projectAgg,
            leaveAgg,
            monthlyTrendAgg,
            distributionAgg,
            holidayStats,
            pendingLeaves,
            upcomingDeadlines,
            recentTasks
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: 'admin' } }),
            Team.countDocuments(),
            Department.countDocuments(),
            Project.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        upcoming: { $sum: { $cond: [{ $eq: ["$status", "upcoming"] }, 1, 0] } },
                        ongoing: { $sum: { $cond: [{ $eq: ["$status", "ongoing"] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        onHold: { $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] } }
                    }
                }
            ]),
            Leave.aggregate([
                {
                    $facet: {
                        pending: [{ $match: { status: 'pending' } }, { $count: "count" }],
                        approvedThisMonth: [
                            {
                                $match: {
                                    status: 'approved',
                                    fromDate: { $gte: startOfMonth }
                                }
                            },
                            { $count: "count" }
                        ],
                        rejectedThisMonth: [
                            {
                                $match: {
                                    status: 'rejected',
                                    updatedAt: { $gte: startOfMonth }
                                }
                            },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            Leave.aggregate([
                { $match: { fromDate: { $gte: startOfYear }, status: 'approved' } },
                {
                    $group: {
                        _id: { $month: "$fromDate" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            Leave.aggregate([
                {
                    $group: {
                        _id: "$leaveType",
                        value: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        label: "$_id",
                        value: 1,
                        _id: 0
                    }
                }
            ]),
            Holiday.aggregate([
                {
                    $facet: {
                        upcoming: [
                            { $match: { date: { $gte: today } } },
                            { $sort: { date: 1 } },
                            { $limit: 1 }
                        ],
                        total: [
                            { $match: { date: { $gte: startOfYear, $lte: new Date(today.getFullYear(), 11, 31) } } },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            Leave.find({ status: 'pending' }).populate('user', 'name profilePicture').limit(5).sort({ createdAt: -1 }).lean(),
            Project.find({ status: 'ongoing', endDate: { $gte: today } }).populate('assignedTeam', 'name').sort({ endDate: 1 }).limit(5).lean(),
            Task.find().sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name').lean()
        ]);

        // 2. Data Formatting
        const projectStats = projectAgg[0] || { total: 0, upcoming: 0, ongoing: 0, completed: 0, onHold: 0 };
        const leavesSummary = {
            pending: leaveAgg[0].pending[0]?.count || 0,
            approvedThisMonth: leaveAgg[0].approvedThisMonth[0]?.count || 0,
            rejectedThisMonth: leaveAgg[0].rejectedThisMonth[0]?.count || 0
        };

        const holidayInfo = {
            upcoming: holidayStats[0].upcoming[0] || null,
            total: holidayStats[0].total[0]?.count || 0
        };

        // Initialize 12 months with 0
        const monthlyTrend = Array(12).fill(0);
        monthlyTrendAgg.forEach(item => {
            monthlyTrend[item._id - 1] = item.count;
        });

        const activityFeed = recentTasks.map(task => ({
            message: `${task.assignedTo?.name || 'System'} was assigned to "${task.title}"`,
            time: task.createdAt,
            type: 'task'
        }));

        // Get team performance snapshot
        const teams = await Team.find().populate('teamLead', 'name').lean();
        const teamPerformance = await Promise.all(teams.map(async team => {
            const projects = await Project.find({ assignedTeam: team._id });
            const avgProgress = projects.length > 0
                ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
                : 0;
            const activeProjects = projects.filter(p => ['ongoing', 'upcoming'].includes(p.status)).length;

            return {
                _id: team._id,
                name: team.name,
                lead: team.teamLead?.name || 'No Lead',
                members: team.members.length,
                activeProjects,
                avgProgress
            };
        }));

        res.json({
            summary: {
                employees: totalEmployees,
                teams: totalTeams,
                departments: totalDepartments,
                projects: {
                    upcoming: projectStats.upcoming,
                    ongoing: projectStats.ongoing,
                    completed: projectStats.completed,
                    onHold: projectStats.onHold,
                    total: projectStats.total
                },
                leaves: leavesSummary,
                holidays: holidayInfo
            },
            pendingActions: {
                leaves: pendingLeaves,
                deadlines: upcomingDeadlines.map(p => ({
                    _id: p._id,
                    name: p.name,
                    endDate: p.endDate,
                    assignedTeam: p.assignedTeam
                }))
            },
            teamPerformance,
            recentActivity: activityFeed,
            monthlyTrend,
            distribution: distributionAgg
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};

export const getReportStats = async (req, res) => {
    try {
        const approvedLeaves = await Leave.find({ status: 'approved' });
        const allEmployees = await User.find({ role: 'employee' }).select('name _id');

        // Summary Metrics
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

        const totalQuota = allEmployees.length * 24;
        const utilizationRate = totalQuota > 0 ? ((totalDays / totalQuota) * 100).toFixed(1) : 0;

        res.json({
            summary: {
                totalLeaves: totalLeavesCount,
                avgDuration,
                mostCommonType,
                utilizationRate
            },
            monthlyData: [],
            employeeStats: []
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch report stats" });
    }
};

// ==================================================
// EMPLOYEE MANAGEMENT
// ==================================================

export const createEmployee = async (req, res) => {
    try {
        const { name, email, phone, role, department, team, reportingManager, skills, experienceLevel } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const firstName = name.split(' ')[0].toLowerCase();
        const defaultPassword = `${firstName}123`;

        const parseSkills = (skillsData) => {
            if (!skillsData) return [];
            try { return JSON.parse(skillsData); } catch (e) { return skillsData.split(',').map(s => s.trim()); }
        };

        const newUser = await User.create({
            name, email, phone, password: defaultPassword,
            role: role || 'employee',
            department, team, reportingManager,
            skills: parseSkills(skills),
            experienceLevel,
            leaveBalance: {
                cl: req.body.cl ? parseInt(req.body.cl) : 12,
                sl: req.body.sl ? parseInt(req.body.sl) : 10,
                el: req.body.el ? parseInt(req.body.el) : 15
            },
            qualification: req.body.qualification || ''
        });

        res.status(201).json({ message: "Employee created", user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create employee" });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: { $ne: 'admin' } })
            .populate('reportingManager', 'name').populate('department', 'name').populate('team', 'name').sort({ createdAt: -1 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch employees" });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('reportingManager', 'name').populate('department', 'name').populate('team', 'name');
        if (!user) return res.status(404).json({ message: "Employee not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch employee" });
    }
};

export const updateEmployee = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { role, ...updateData } = req.body;

        const user = await User.findById(id).session(session);
        if (!user) throw new Error("Employee not found");

        // 1. Handle Role Change via Service
        if (role && role !== user.role) {
            console.log(`[DEBUG] updateEmployee: Role change detected for ${id} from ${user.role} to ${role}`);
            await promoteUser(id, role, session);
        } else if (role) {
            console.log(`[DEBUG] updateEmployee: Role match (${role}), skipping promotion.`);
        }

        // 2. Formatting
        if (updateData.skills) {
            try { updateData.skills = JSON.parse(updateData.skills); }
            catch (e) { updateData.skills = updateData.skills.split(',').map(s => s.trim()); }
        }

        // Handle Leave Balance
        if (updateData.cl !== undefined || updateData.sl !== undefined || updateData.el !== undefined) {
            updateData.leaveBalance = {
                cl: updateData.cl !== undefined ? parseInt(updateData.cl) : user.leaveBalance?.cl || 12,
                sl: updateData.sl !== undefined ? parseInt(updateData.sl) : user.leaveBalance?.sl || 10,
                el: updateData.el !== undefined ? parseInt(updateData.el) : user.leaveBalance?.el || 15
            };
        }

        // Use findByIdAndUpdate to allow discriminator key (role) update
        const updatedUser = await User.findByIdAndUpdate(
            id, { $set: updateData }, { new: true, runValidators: true, session }
        );

        await session.commitTransaction();
        res.json({ message: "Employee updated successfully", user: updatedUser });
    } catch (error) {
        await session.abortTransaction();
        console.error("Update Employee Error:", error);
        res.status(500).json({ message: error.message || "Update failed" });
    } finally {
        session.endSession();
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Employee deleted" });
    } catch (e) { res.status(500).json({ message: "Failed to delete" }); }
};

// ==================================================
// DEPARTMENT MANAGEMENT
// ==================================================
export const createDepartment = async (req, res) => {
    try {
        const dept = await Department.create(req.body);
        res.status(201).json(dept);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const getAllDepartments = async (req, res) => {
    try {
        const depts = await Department.find();
        res.json(depts);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const updateDepartment = async (req, res) => {
    try {
        const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(dept);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: e.message }); }
};


// ==================================================
// TEAM MANAGEMENT (TRANSACTIONS)
// ==================================================

export const createTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, department, teamLead, members = [] } = req.body;

        // 1. Create Team
        const [team] = await Team.create([{ name, department, teamLead, members }], { session });

        // 2. Promote Lead (if assigned)
        if (teamLead) {
            console.log(`[DEBUG] createTeam: Promoting lead ${teamLead}`);
            await promoteUser(teamLead, 'team-lead', session);
            // Use native driver for consistency
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(teamLead) },
                { $set: { team: team._id } },
                { session }
            );
        }

        // 3. Update Members
        if (members.length > 0) {
            await User.updateMany(
                { _id: { $in: members } },
                { team: team._id },
                { session }
            );
        }

        await session.commitTransaction();
        res.status(201).json(team);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to create team" });
    } finally {
        session.endSession();
    }
};

export const updateTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { name, department, teamLead, members = [] } = req.body;

        const team = await Team.findById(id).session(session);
        if (!team) throw new Error("Team not found");

        const oldLeadId = team.teamLead ? team.teamLead.toString() : null;
        const newLeadId = teamLead || null;

        // 1. Handle Lead Swap
        if (newLeadId !== oldLeadId) {
            console.log(`[DEBUG] Step 1: Lead change detected. Old: ${oldLeadId}, New: ${newLeadId}`);

            // Demote Old
            if (oldLeadId) {
                console.log(`[DEBUG] Step 1a: Demoting old lead ${oldLeadId}`);
                try {
                    await promoteUser(oldLeadId, 'employee', session);
                } catch (e) {
                    console.error("[DEBUG] Step 1a FAILED (promoteUser):", e);
                    throw e;
                }

                console.log(`[DEBUG] Step 1b: Unsetting team for old lead ${oldLeadId}`);
                try {
                    await User.collection.updateOne(
                        { _id: new mongoose.Types.ObjectId(oldLeadId) },
                        { $set: { team: null } },
                        { session }
                    );
                } catch (e) {
                    console.error("[DEBUG] Step 1b FAILED (updateOne):", e);
                    throw e;
                }

                // VERIFICATION
                const debugOldUser = await User.collection.findOne(
                    { _id: new mongoose.Types.ObjectId(oldLeadId) },
                    { session }
                );
                console.log(`[DEBUG] Verify Old Lead Role in DB (pre-commit): ${debugOldUser?.role}, Team: ${debugOldUser?.team}`);
            }

            // Promote New
            if (newLeadId) {
                console.log(`[DEBUG] Step 1c: Promoting new lead ${newLeadId}`);
                try {
                    await promoteUser(newLeadId, 'team-lead', session);
                } catch (e) {
                    console.error("[DEBUG] Step 1c FAILED (promoteUser):", e);
                    throw e;
                }

                console.log(`[DEBUG] Step 1d: Setting team for new lead ${newLeadId}`);
                try {
                    await User.collection.updateOne(
                        { _id: new mongoose.Types.ObjectId(newLeadId) },
                        { $set: { team: id } },
                        { session }
                    );
                } catch (e) {
                    console.error("[DEBUG] Step 1d FAILED (updateOne):", e);
                    throw e;
                }
            }
        } else {
            console.log(`[DEBUG] Step 1: No lead change detected.`);
        }

        // 2. Update Members
        console.log(`[DEBUG] Step 2: Updating Members...`);
        try {
            const oldMembers = team.members.map(m => m.toString());
            const newMembers = members.map(m => m.toString());
            const membersToRemove = oldMembers.filter(m => !newMembers.includes(m));
            const membersToAdd = newMembers.filter(m => !oldMembers.includes(m));

            if (membersToRemove.length > 0) {
                await User.updateMany({ _id: { $in: membersToRemove } }, { team: null }, { session });
            }
            if (membersToAdd.length > 0) {
                await User.updateMany({ _id: { $in: membersToAdd } }, { team: id }, { session });
            }
        } catch (e) {
            console.error("[DEBUG] Step 2 FAILED (Member Update):", e);
            throw e;
        }

        // 3. Update Team Doc
        console.log(`[DEBUG] Step 3: Updating Team Doc...`);
        try {
            // Use findByIdAndUpdate to avoid validation conflicts with native driver updates
            await Team.findByIdAndUpdate(
                id,
                {
                    $set: {
                        name: name || team.name,
                        department: department || team.department,
                        teamLead: newLeadId,
                        members: members
                    }
                },
                { session, new: true, runValidators: false }
            );
        } catch (e) {
            console.error("[DEBUG] Step 3 FAILED (Team Update):", e);
            throw e;
        }

        console.log(`[DEBUG] Committing Transaction for Team ${id}...`);
        await session.commitTransaction();
        console.log(`[DEBUG] Transaction Committed Successfully.`);

        // Return updated team
        const updatedTeam = await Team.findById(id).populate('department').populate('teamLead', 'name email');
        res.json(updatedTeam);
    } catch (error) {
        await session.abortTransaction();
        console.error("Update Team Transaction Error:", error);
        res.status(500).json({ message: error.message || "Failed to update team" });
    } finally {
        session.endSession();
    }
};

export const deleteTeam = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const team = await Team.findById(id).session(session);

        if (team && team.teamLead) {
            console.log(`[DEBUG] deleteTeam: Demoting lead ${team.teamLead}`);
            await promoteUser(team.teamLead, 'employee', session);
            await User.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(team.teamLead) },
                { $set: { team: null } },
                { session }
            );
        }

        await User.updateMany({ team: id }, { team: null }, { session });
        await Team.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        res.json({ message: "Team deleted" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || "Failed to delete team" });
    } finally {
        session.endSession();
    }
};

export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('department').populate('teamLead', 'name email');
        res.json(teams);
    } catch (error) { res.status(500).json({ msg: "Failed to fetch" }); }
};

export const manageTeamMembers = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { teamId, memberId, action } = req.body;
        const team = await Team.findById(teamId).session(session);
        if (!team) throw new Error("Team not found");

        if (action === 'add') {
            if (!team.members.includes(memberId)) {
                team.members.push(memberId);
                await User.findByIdAndUpdate(memberId, { team: teamId }, { session });
            }
        } else {
            team.members = team.members.filter(m => m.toString() !== memberId);
            await User.findByIdAndUpdate(memberId, { team: null }, { session });
        }

        await team.save({ session });
        await session.commitTransaction();
        res.json(team);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Failed to manage team members" });
    } finally { session.endSession(); }
};

// ==================================================
// PROJECT & HOLIDAY & LEAVE (Standard)
// ==================================================
export const createProject = async (req, res) => {
    try {
        const project = await Project.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate({ path: 'assignedTeam', populate: { path: 'department' } }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (e) { res.status(500).json({ msg: "Failed to fetch" }); }
};
export const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(project);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};
export const updateProjectStatus = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, { status: req.body.status, progress: req.body.progress }, { new: true });
        res.json(project);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
export const deleteProject = async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ project: req.params.id });
        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const createHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.create(req.body);
        res.status(201).json(holiday);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};
export const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
export const deleteHoliday = async (req, res) => {
    try {
        await Holiday.findByIdAndDelete(req.params.id);
        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('user', 'name email department role').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined },
            { new: true }
        );
        res.json(leave);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const promoteUserAccount = async (req, res) => {
    try {
        const updatedUser = await promoteUser(req.params.id, req.body.role);
        res.json({ message: `Promoted to ${req.body.role}`, user: updatedUser });
    } catch (e) { res.status(400).json({ message: e.message }); }
};
