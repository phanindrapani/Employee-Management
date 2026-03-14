import Attendance from '../../models/attendance.model.js';
import { getIO } from '../../socket.js';

const getGeoConfig = () => {
    const officeLat = Number.parseFloat(process.env.OFFICE_LAT);
    const officeLng = Number.parseFloat(process.env.OFFICE_LNG);
    const parsedRadius = Number.parseFloat(process.env.OFFICE_RADIUS_METERS);
    const officeRadiusMeters = Number.isFinite(parsedRadius) ? parsedRadius : 200;
    const isGeoEnforced = Number.isFinite(officeLat) && Number.isFinite(officeLng);
    return { officeLat, officeLng, officeRadiusMeters, isGeoEnforced };
};

const getDayRange = (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { start, end };
};

const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const validateLocation = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { ok: false, message: 'Location is required for attendance' };
    }

    const { officeLat, officeLng, officeRadiusMeters, isGeoEnforced } = getGeoConfig();

    if (!isGeoEnforced) {
        return { ok: true, lat, lng, distance: null };
    }

    const distance = haversineMeters(lat, lng, officeLat, officeLng);
    if (distance > officeRadiusMeters) {
        return {
            ok: false,
            message: `You are outside office range (${Math.round(distance)}m away, allowed ${Math.round(officeRadiusMeters)}m)`
        };
    }

    return { ok: true, lat, lng, distance };
};

export const checkIn = async (req, res) => {
    try {
        const { latitude, longitude } = req.body || {};
        const locationCheck = validateLocation(latitude, longitude);
        if (!locationCheck.ok) {
            return res.status(403).json({ message: locationCheck.message });
        }

        const now = new Date();
        const { start, end } = getDayRange(now);

        let record = await Attendance.findOne({
            user: req.user._id,
            date: { $gte: start, $lt: end }
        }).lean();

        if (record?.checkIn) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        const lateCutoff = new Date(start);
        lateCutoff.setHours(10, 30, 0, 0);
        const status = now > lateCutoff ? 'Late' : 'Present';

        if (!record) {
            record = await Attendance.create({
                user: req.user._id,
                date: start,
                checkIn: now,
                checkInLocation: {
                    latitude: locationCheck.lat,
                    longitude: locationCheck.lng
                },
                status
            });
        } else {
            record = await Attendance.findByIdAndUpdate(record._id, {
                $set: {
                    checkIn: now,
                    status: status,
                    checkInLocation: {
                        latitude: locationCheck.lat,
                        longitude: locationCheck.lng
                    }
                }
            }, { new: true });
        }

        setImmediate(() => {
            try {
                const io = getIO();
                io.to(`user:${req.user._id}`).emit('attendance:updated', record);
                io.to('role:admin').emit('attendance:updated', record);
            } catch (socketError) {
                console.error('Socket emit error (attendance check-in):', socketError.message);
            }
        });

        res.json(record);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }
        res.status(500).json({ message: error.message || 'Failed to check in' });
    }
};

export const checkOut = async (req, res) => {
    try {
        const { latitude, longitude } = req.body || {};
        const locationCheck = validateLocation(latitude, longitude);
        if (!locationCheck.ok) {
            return res.status(403).json({ message: locationCheck.message });
        }

        const now = new Date();
        const { start, end } = getDayRange(now);

        const record = await Attendance.findOne({
            user: req.user._id,
            date: { $gte: start, $lt: end }
        }).lean();

        if (!record || !record.checkIn) {
            return res.status(400).json({ message: 'Check in first before check out' });
        }
        if (record.checkOut) {
            return res.status(400).json({ message: 'Already checked out for today' });
        }

        const hours = (now - new Date(record.checkIn)) / (1000 * 60 * 60);
        const workingHours = Math.max(0, Number(hours.toFixed(2)));
        let status = record.status;

        if (workingHours >= 8) {
            status = 'Present';
        } else if (workingHours >= 4) {
            status = 'Half-Day';
        } else {
            status = 'Absent';
        }

        const updatedRecord = await Attendance.findByIdAndUpdate(record._id, {
            $set: {
                checkOut: now,
                checkOutLocation: {
                    latitude: locationCheck.lat,
                    longitude: locationCheck.lng
                },
                workingHours,
                status
            }
        }, { new: true });

        setImmediate(() => {
            try {
                const io = getIO();
                io.to(`user:${req.user._id}`).emit('attendance:updated', updatedRecord);
                io.to('role:admin').emit('attendance:updated', updatedRecord);
            } catch (socketError) {
                console.error('Socket emit error (attendance check-out):', socketError.message);
            }
        });

        res.json(updatedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to check out' });
    }
};

export const getTodayAttendance = async (req, res) => {
    try {
        const { start, end } = getDayRange(new Date());
        const record = await Attendance.findOne({
            user: req.user._id,
            date: { $gte: start, $lt: end }
        }).lean();
        res.json(record || null);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch today attendance' });
    }
};

export const getMyAttendance = async (req, res) => {
    try {
        const now = new Date();
        const [year, month] = (req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
            .split('-')
            .map(Number);

        const { start, end } = getMonthRange(year, month);
        const records = await Attendance.find({
            user: req.user._id,
            date: { $gte: start, $lt: end }
        })
        .select('date status checkIn checkOut workingHours')
        .sort({ date: -1 })
        .lean();

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch attendance history' });
    }
};
