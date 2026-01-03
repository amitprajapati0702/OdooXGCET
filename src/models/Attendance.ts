import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    employeeId: mongoose.Schema.Types.ObjectId;
    date: Date; // Normalized to midnight for querying
    checkIn: Date;
    checkOut?: Date;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
    workHours?: number; // In hours (float)
    extraHours?: number;
}

const AttendanceSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        checkIn: { type: Date },
        checkOut: { type: Date },
        status: {
            type: String,
            enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'],
            default: 'PRESENT',
        },
        workHours: { type: Number, default: 0 },
        extraHours: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Compound index to ensure one attendance record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
