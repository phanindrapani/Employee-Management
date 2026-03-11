import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import Team from '../../models/team.model.js';

const router = express.Router();

router.get('/', protect, authorizeRole(['manager']), async (req, res) => {
    try {
        const teams = await Team.find({}).populate('department').populate('teamLead', 'name email');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teams" });
    }
});

export default router;
