import Department from '../../models/department.model.js';
import { getIO } from '../../socket.js';

export const createDepartment = async (req, res) => {
    try {
        const dept = await Department.create(req.body);

        try {
            const io = getIO();
            io.to('role:admin').emit('department:created', dept);
        } catch (e) { console.error('Socket emit error:', e); }

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

        try {
            const io = getIO();
            io.to('role:admin').emit('department:updated', dept);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(dept);
    } catch (e) { res.status(500).json({ msg: e.message }); }
};

export const deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);

        try {
            const io = getIO();
            io.to('role:admin').emit('department:deleted', req.params.id);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: e.message }); }
};
