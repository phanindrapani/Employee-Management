import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import User from '../../models/user.model.js';

const router = express.Router();

router.get('/', protect, authorizeRole(['manager']), async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};

        if (role === 'client') {
            query = { role: 'client' };
        } else if (role === 'employee') {
            query = { role: 'employee' };
        } else {
            query = { role: { $in: ['employee', 'team-lead', 'manager'] } };
        }

        const users = await User.find(query).select('name email role company').sort({ name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

export default router;
