import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Half-Day'],
        default: 'Absent'
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingHours: { type: Number, default: 0 } // Computed hours
}, { timestamps: true });

// Compound index to prevent duplicate attendance records for same user on same day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
