import Holiday from '../models/holiday.model.js';

export const addHoliday = async (req, res) => {
    const { name, date, type, description } = req.body;

    const holidayExists = await Holiday.findOne({ date });
    if (holidayExists) {
        return res.status(400).json({ message: 'Holiday already marked for this date' });
    }

    const holiday = await Holiday.create({ name, date, type, description });
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
    const { name, type, description } = req.body;
    const holiday = await Holiday.findById(req.params.id);

    if (holiday) {
        holiday.name = name || holiday.name;
        holiday.type = type || holiday.type;
        holiday.description = description || holiday.description;

        const updatedHoliday = await holiday.save();
        res.json(updatedHoliday);
    } else {
        res.status(404).json({ message: 'Holiday not found' });
    }
};
