import Employee from "../models/employee.model.js";
import User from "../../models/user.model.js";
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

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

// Helper to extract specifically the profile picture
async function uploadProfilePicture(files) {
  const file = files?.profilePicture?.[0];
  if (!file) return undefined;
  return await uploadBufferToCloudinary(file, fieldToFolder.profilePicture);
}

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const { name, email, phone, address, qualification } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists for this email" });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee already exists for this email" });
    }

    const defaultPassword = buildDefaultPassword(name);

    // Initial upload of profile picture if provided
    const profilePictureUrl = await uploadProfilePicture(req.files);

    const user = await User.create({
      name,
      email,
      password: defaultPassword,
      role: "employee",
      phone,
      profilePicture: profilePictureUrl
    });

    let employee;
    try {
      const documents = await buildCloudinaryDocumentMap(req.files);
      employee = await Employee.create({
        name,
        email,
        phone,
        address,
        qualification,
        documents,
        profilePicture: profilePictureUrl
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }

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
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updatedData = {
      ...req.body
    };

    // Keep existing documents and update only the new ones
    if (req.files && Object.keys(req.files).length > 0) {
      updatedData.documents = await buildCloudinaryDocumentMap(req.files, employee.documents.toObject());

      if (req.files.profilePicture) {
        const profilePictureUrl = await uploadProfilePicture(req.files);
        updatedData.profilePicture = profilePictureUrl;
        await User.findOneAndUpdate({ email: employee.email }, {
          profilePicture: profilePictureUrl
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    res.json({
      message: "Employee updated",
      employee: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
