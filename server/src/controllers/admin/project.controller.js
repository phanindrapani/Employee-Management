import Project from '../../models/project.model.js';
import Task from '../../models/task.model.js';

// ==================================================
// PROJECT MANAGEMENT
// ==================================================
export const createProject = async (req, res) => {
    try {
        // Enforce progress: 0 on creation
        const { progress, ...projectData } = req.body;
        const project = await Project.create({ ...projectData, progress: 0, createdBy: req.user._id });
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
        // Prevent manual progress update by Admin. Progress is driven by tasks.
        const { progress, ...updateData } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
