import User from "../../models/user.model.js";
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import { getLeaveQuotas } from "../../services/settings.service.js";
import { promoteUser } from '../../services/promotion.service.js';
import mongoose from 'mongoose';
import { getIO } from '../../socket.js';

const fieldToFolder = {
  tenth: "10th",
  twelfth: "12th",
  degree: "degree",
  offerletter: "offerletter",
  joiningletter: "joiningletter",
  resume: "resume",
  profilePicture: "profile_pictures"
};

async function buildCloudinaryDocumentMap(files = {}, existingDocuments = {}) {
  const documents = { ...existingDocuments };

  for (const [fieldName, folder] of Object.entries(fieldToFolder)) {
    const file = files?.[fieldName]?.[0];
    if (!file) continue;

    const url = await uploadBufferToCloudinary(file, folder);
    if (fieldName !== 'profilePicture') {
      documents[fieldName] = url;
    }
  }

  return documents;
}

const buildDefaultPassword = (name) => {
  const firstName = (name || "").trim().split(/\s+/)[0] || "Employee";
  return `${firstName}123`;
};

async function uploadProfilePicture(files) {
  const file = files?.profilePicture?.[0];
  if (!file) return undefined;
  return await uploadBufferToCloudinary(file, fieldToFolder.profilePicture);
}

export const getEmployees = async (req, res) => {
  try {
    const { role } = req.query;

    let query = req.user?.role === 'admin'
      ? { role: { $in: ['employee', 'manager', 'team-lead'] } }
      : { role: 'employee' };

    if (role) {
      if (req.user?.role === 'admin' && ['employee', 'manager', 'team-lead'].includes(role)) {
        query.role = role;
      } else if (req.user?.role !== 'admin' && role === 'employee') {
        query.role = role;
      } else {
        query.role = role;
      }
    }

    const employees = await User.find(query)
      .populate('department', 'name')
      .populate('team', 'name')
      .populate('reportingManager', 'name')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name')
      .populate('team', 'name')
      .populate('reportingManager', 'name');
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const {
      name, email, phone, address, qualification, cl, sl, el,
      experienceLevel, role, department, team, reportingManager, skills
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists for this email" });
    }

    const defaultPassword = buildDefaultPassword(name);
    const profilePictureUrl = await uploadProfilePicture(req.files);
    const documents = await buildCloudinaryDocumentMap(req.files);
    const quotas = await getLeaveQuotas();

    const parseSkills = (skillsData) => {
      if (!skillsData) return [];
      try { return JSON.parse(skillsData); } catch (e) { return skillsData.split(',').map(s => s.trim()); }
    };

    const employee = await User.create({
      name,
      email,
      password: defaultPassword,
      role: role || "employee",
      phone,
      profilePicture: profilePictureUrl,
      address,
      qualification,
      experienceLevel: experienceLevel || 'Junior',
      department,
      team,
      reportingManager,
      skills: parseSkills(skills),
      documents,
      leaveBalance: {
        cl: cl !== undefined ? parseInt(cl) : quotas.cl,
        sl: sl !== undefined ? parseInt(sl) : quotas.sl,
        el: el !== undefined ? parseInt(el) : quotas.el
      }
    });

    try {
      const io = getIO();
      io.to('role:admin').emit('employee:created', employee);
    } catch (e) { console.error('Socket emit error:', e); }

    res.status(201).json({
      message: "Employee added successfully",
      employee,
      defaultPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { role, skills, ...updateData } = req.body;

    const user = await User.findById(id).session(session);
    if (!user) {
      throw new Error("Employee not found");
    }

    if (role && role !== user.role) {
      await promoteUser(id, role, session);
    }

    if (req.files && Object.keys(req.files).length > 0) {
      updateData.documents = await buildCloudinaryDocumentMap(req.files, user.documents || {});
      if (req.files.profilePicture) {
        updateData.profilePicture = await uploadProfilePicture(req.files);
      }
    }

    if (skills) {
      try { updateData.skills = JSON.parse(skills); }
      catch (e) { updateData.skills = skills.split(',').map(s => s.trim()); }
    }

    if (updateData.cl !== undefined || updateData.sl !== undefined || updateData.el !== undefined) {
      updateData.leaveBalance = {
        cl: updateData.cl !== undefined ? parseInt(updateData.cl) : user.leaveBalance?.cl,
        sl: updateData.sl !== undefined ? parseInt(updateData.sl) : user.leaveBalance?.sl,
        el: updateData.el !== undefined ? parseInt(updateData.el) : user.leaveBalance?.el
      };
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      { $set: { ...updateData, role: role || user.role } },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();

    try {
      const io = getIO();
      io.to('role:admin').emit('employee:updated', updatedEmployee);
      io.to(`user:${id}`).emit('profile:updated', updatedEmployee);
    } catch (e) { console.error('Socket emit error:', e); }

    res.json({
      message: "Employee updated",
      employee: updatedEmployee
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    try {
      const io = getIO();
      io.to('role:admin').emit('employee:deleted', id);
      io.to(`user:${id}`).emit('account:deleted');
    } catch (e) { console.error('Socket emit error:', e); }

    res.json({ message: "Employee removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const promoteUserAccount = async (req, res) => {
  try {
    const updatedUser = await promoteUser(req.params.id, req.body.role);

    try {
      const io = getIO();
      io.to('role:admin').emit('employee:updated', updatedUser);
      io.to(`user:${req.params.id}`).emit('profile:updated', updatedUser);
    } catch (e) { console.error('Socket emit error:', e); }

    res.json({ message: `Promoted to ${req.body.role}`, user: updatedUser });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
