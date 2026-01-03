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
    // New Profile Fields
    about?: string;
    jobLove?: string;
    hobbies?: string;
    skills?: string[];
    certifications?: string[];
    manager?: string;
    location?: string;
    bankDetails?: {
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        panNo: string;
        uanNo: string;
    };
    salary?: {
        wage: number;
        workingDays: number; // New
        breakTime: number; // New, assuming hours
        basic: number;
        hra: number;
        standardAllowance: number;
        bonus: number;
        lta: number;
        fixedAllowance: number;
        professionalTax: number;
        pfEmployee: number;
        pfEmployer: number;
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
        // New Profile Fields
        about: { type: String },
        jobLove: { type: String },
        hobbies: { type: String },
        skills: { type: [String], default: [] },
        certifications: { type: [String], default: [] },
        manager: { type: String },
        location: { type: String },
        bankDetails: {
            accountNumber: { type: String },
            bankName: { type: String },
            ifscCode: { type: String },
            panNo: { type: String },
            uanNo: { type: String },
        },
        salary: {
            wage: { type: Number, default: 0 },
            workingDays: { type: Number, default: 5 },
            breakTime: { type: Number, default: 1 },
            basic: { type: Number, default: 0 },
            hra: { type: Number, default: 0 },
            standardAllowance: { type: Number, default: 0 },
            bonus: { type: Number, default: 0 },
            lta: { type: Number, default: 0 },
            fixedAllowance: { type: Number, default: 0 },
            professionalTax: { type: Number, default: 200 },
            pfEmployee: { type: Number, default: 0 },
            pfEmployer: { type: Number, default: 0 },
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

// Force model rebuild in dev if schema changed
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.User;
}
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
