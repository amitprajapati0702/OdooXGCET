import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
}

export interface IUser extends Document {
    employeeId: string;
    email: string;
    password?: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    avatar?: string;
    department?: string;
    jobPosition?: string;
    joiningDate: Date;
    address?: string;
    phone?: string;
    bankDetails?: {
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        panNo: string;
        uanNo: string;
    };
    salary?: {
        basic: number;
        allowances: number;
        // other fields as needed
    };
    leaveCredits: {
        sick: number;
        paid: number;
        unpaid: number; // used/taken usually
    };
    forcePasswordChange: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        employeeId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String }, // Optional for initial creation if auto-generated flow
        role: { type: String, enum: Object.values(UserRole), default: UserRole.EMPLOYEE },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        avatar: { type: String },
        department: { type: String },
        jobPosition: { type: String },
        joiningDate: { type: Date, default: Date.now },
        address: { type: String },
        phone: { type: String },
        bankDetails: {
            accountNumber: { type: String },
            bankName: { type: String },
            ifscCode: { type: String },
            panNo: { type: String },
            uanNo: { type: String },
        },
        salary: {
            basic: { type: Number },
            allowances: { type: Number },
        },
        leaveCredits: {
            sick: { type: Number, default: 7 },
            paid: { type: Number, default: 24 },
            unpaid: { type: Number, default: 0 },
        },
        forcePasswordChange: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
