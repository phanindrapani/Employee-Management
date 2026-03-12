import GlobalSetting from '../models/globalSetting.model.js';

export const getLeaveQuotas = async () => {
    try {
        const settings = await GlobalSetting.findOne({ key: 'leave_quotas' });
        if (settings && settings.value) {
            return {
                cl: settings.value.cl || 12,
                sl: settings.value.sl || 10,
                el: settings.value.el || 15
            };
        }
    } catch (error) {
        console.error("Error fetching leave quotas:", error);
    }

    return { cl: 12, sl: 10, el: 15 };
};
