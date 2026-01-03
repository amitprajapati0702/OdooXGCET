import mongoose, { Schema, Document } from 'mongoose';

export enum LeaveType {
    PAID = 'Paid Time Off',
    SICK = 'Sick Leave',
    UNPAID = 'Unpaid Leave',
}

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface ILeave extends Document {
    employeeId: mongoose.Schema.Types.ObjectId;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    days: number;
    reason?: string;
    status: LeaveStatus;
    approvedBy?: mongoose.Schema.Types.ObjectId;
    attachment?: string;
}

const LeaveSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: Object.values(LeaveType), required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        days: { type: Number, required: true },
        reason: { type: String },
        status: {
            type: String,
            enum: Object.values(LeaveStatus),
            default: LeaveStatus.PENDING,
        },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        attachment: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
