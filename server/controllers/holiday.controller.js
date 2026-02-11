import Holiday from '../models/holiday.model.js';

const parseDateOnly = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    return new Date(value);
};

const normalizeToLocalDate = (value) => {
    const d = parseDateOnly(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const getLocalDayRange = (value) => {
    const start = normalizeToLocalDate(value);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    return { start, end };
};

export const addHoliday = async (req, res) => {
    const { name, date, type, description } = req.body;

    const { start, end } = getLocalDayRange(date);

    const holidayExists = await Holiday.findOne({
        date: { $gte: start, $lt: end }
    });
    if (holidayExists) {
        return res.status(400).json({ message: 'Holiday already marked for this date' });
    }

    const holiday = await Holiday.create({ name, date: start, type, description });
    res.status(201).json(holiday);
};

export const getHolidays = async (req, res) => {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.json(holidays);
};

export const deleteHoliday = async (req, res) => {
    const holiday = await Holiday.findById(req.params.id);
    if (holiday) {
        await holiday.deleteOne();
        res.json({ message: 'Holiday removed' });
    } else {
        res.status(404).json({ message: 'Holiday not found' });
    }
};

export const updateHoliday = async (req, res) => {
    const { name, date, type, description } = req.body;
    const holiday = await Holiday.findById(req.params.id);

    if (holiday) {
        holiday.name = name || holiday.name;
        holiday.type = type || holiday.type;
        holiday.description = description || holiday.description;
        if (date) {
            holiday.date = normalizeToLocalDate(date);
        }

        const updatedHoliday = await holiday.save();
        res.json(updatedHoliday);
    } else {
        res.status(404).json({ message: 'Holiday not found' });
    }
};
