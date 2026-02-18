import Attendance from '../../models/attendance.model.js';
import User from '../../models/user.model.js';

const getDayRange = (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

export const getDailyAttendance = async (req, res) => {
    try {
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        if (Number.isNaN(targetDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
        }
        const { start, end } = getDayRange(targetDate);

        const users = await User.find({ role: { $in: ['employee', 'team-lead'] } })
            .select('_id name email role department team');

        const records = await Attendance.find({
            user: { $in: users.map((u) => u._id) },
            date: { $gte: start, $lt: end }
        });

        const recordByUser = new Map(records.map((r) => [String(r.user), r]));
        const rows = users.map((u) => {
            const rec = recordByUser.get(String(u._id));
            return {
                user: {
                    _id: u._id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    department: u.department || null,
                    team: u.team || null
                },
                date: start,
                status: rec?.status || 'Absent',
                checkIn: rec?.checkIn || null,
                checkOut: rec?.checkOut || null,
                workingHours: rec?.workingHours || 0
            };
        });

        const summary = rows.reduce((acc, row) => {
            acc[row.status] = (acc[row.status] || 0) + 1;
            return acc;
        }, { Present: 0, Late: 0, 'Half-Day': 0, Absent: 0 });

        res.json({
            date: start.toISOString().slice(0, 10),
            summary,
            records: rows
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch daily attendance' });
    }
};
