import Employee from "../models/employee.model.js";
import User from "../../models/user.model.js";

const buildDefaultPassword = (name) => {
  const firstName = (name || "").trim().split(/\s+/)[0] || "Employee";
  return `${firstName}123`;
};

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

    const user = await User.create({
      name,
      email,
      password: defaultPassword,
      role: "employee",
      phone
    });

    let employee;
    try {
      employee = await Employee.create({
        name,
        email,
        phone,
        address,
        qualification,
        documents: {
          tenth: req.files?.tenth?.[0]?.path,
          twelfth: req.files?.twelfth?.[0]?.path,
          degree: req.files?.degree?.[0]?.path,
          offerletter: req.files?.offerletter?.[0]?.path,
          joiningletter: req.files?.joiningletter?.[0]?.path,
          resume: req.files?.resume?.[0]?.path    
        }
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
      updatedData.documents = { ...employee.documents,
        tenth: req.files?.tenth?.[0]?.path || employee.documents.tenth,
        twelfth: req.files?.twelfth?.[0]?.path || employee.documents.twelfth,
        degree: req.files?.degree?.[0]?.path || employee.documents.degree,
        offerletter: req.files?.offerletter?.[0]?.path || employee.documents.offerletter,
        joiningletter: req.files?.joiningletter?.[0]?.path || employee.documents.joiningletter,
        resume: req.files?.resume?.[0]?.path || employee.documents.resume
      };
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
