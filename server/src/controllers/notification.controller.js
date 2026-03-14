import Notification from '../models/notification.model.js';

export const getMyNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments({ user: req.user._id });

        res.json({
            notifications,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

export const markAsRead = async (req, res) => {
    const updated = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true }
    ).lean();

    if (updated) {
        res.json({ message: 'Notification marked as read' });
    } else {
        res.status(404).json({ message: 'Notification not found' });
    }
};

export const markAllAsRead = async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
};
