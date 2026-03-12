import Holiday from '../../models/holiday.model.js';
import { getIO } from '../../socket.js';

export const createHoliday = async (req, res) => {
    try {
        const { name, type, description, date } = req.body;
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Invalid holiday date" });
        }

        parsedDate.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(parsedDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const existingHoliday = await Holiday.findOne({
            date: { $gte: parsedDate, $lt: nextDay }
        });
        if (existingHoliday) {
            return res.status(400).json({ message: "A holiday already exists on this date" });
        }

        const holiday = await Holiday.create({
            name,
            type,
            description,
            date: parsedDate
        });

        try {
            const io = getIO();
            io.emit('holiday:created', holiday);
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(holiday);
    } catch (e) {
        if (e?.code === 11000) {
            return res.status(400).json({ message: "A holiday already exists on this date" });
        }
        res.status(500).json({ msg: e.message });
    }
};

export const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};

export const deleteHoliday = async (req, res) => {
    try {
        await Holiday.findByIdAndDelete(req.params.id);

        try {
            const io = getIO();
            io.emit('holiday:deleted', req.params.id);
        } catch (e) { console.error('Socket emit error:', e); }

        res.json({ msg: "Deleted" });
    } catch (e) { res.status(500).json({ msg: "Failed" }); }
};
