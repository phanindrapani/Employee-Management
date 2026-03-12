import GlobalSetting from '../../models/globalSetting.model.js';

export const getLeaveSettings = async (req, res) => {
    try {
        let settings = await GlobalSetting.findOne({ key: 'leave_quotas' });

        if (!settings) {
            settings = await GlobalSetting.create({
                key: 'leave_quotas',
                value: {
                    cl: 12,
                    sl: 10,
                    el: 15
                },
                description: 'Global leave quotas for all employees'
            });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leave settings" });
    }
};

import { getIO } from '../../socket.js';

export const updateLeaveSettings = async (req, res) => {
    try {
        const { value } = req.body;

        const settings = await GlobalSetting.findOneAndUpdate(
            { key: 'leave_quotas' },
            { value },
            { new: true, upsert: true }
        );
        try {
            const io = getIO();
            io.to('role:admin').emit('settings:updated', settings);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to update leave settings" });
    }
};
