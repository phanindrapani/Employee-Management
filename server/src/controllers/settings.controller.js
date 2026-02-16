import GlobalSetting from '../models/globalSetting.model.js';

export const getLeaveSettings = async (req, res) => {
    try {
        let settings = await GlobalSetting.findOne({ key: 'leave_quotas' });

        // Seed default if not found
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

export const updateLeaveSettings = async (req, res) => {
    try {
        const { value } = req.body;

        const settings = await GlobalSetting.findOneAndUpdate(
            { key: 'leave_quotas' },
            { value },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to update leave settings" });
    }
};
