
import mongoose, { Schema, Document } from 'mongoose';

export interface IPayslip extends Document {
    employeeId: mongoose.Schema.Types.ObjectId;
    month: number; // 1-12
    year: number;
    wage: number;
    totalWorkingDays: number;
    presentDays: number;
    leaveDays: number; // Approved Paid Leaves
    unpaidDays: number; // Unpaid Leave + Absent
    deductionAmount: number;
    netSalary: number;
    status: 'DRAFT' | 'PAID';
    viewedByEmployee: boolean;
    generatedAt: Date;
}

const PayslipSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        wage: { type: Number, required: true },
        totalWorkingDays: { type: Number, default: 0 },
        presentDays: { type: Number, default: 0 },
        leaveDays: { type: Number, default: 0 },
        unpaidDays: { type: Number, default: 0 },
        deductionAmount: { type: Number, default: 0 },
        netSalary: { type: Number, default: 0 },
        status: { type: String, enum: ['DRAFT', 'PAID'], default: 'DRAFT' },
        viewedByEmployee: { type: Boolean, default: false },
        generatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Ensure one payslip per employee per month
PayslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Payslip || mongoose.model<IPayslip>('Payslip', PayslipSchema);
