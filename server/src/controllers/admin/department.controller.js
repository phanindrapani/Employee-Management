import Department from '../../models/department.model.js';

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
