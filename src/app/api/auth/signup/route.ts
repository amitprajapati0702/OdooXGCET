import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User, { UserRole } from '@/models/User';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companyName, firstName, lastName, email, phone, password } = body;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a simple Employee ID for the first admin
        const employeeId = `ADM-${Date.now().toString().slice(-4)}`;

        const newUser = await User.create({
            employeeId,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: UserRole.ADMIN,
            department: 'Management',
            jobPosition: 'HR/Admin',
            // Store company name potentially in a separate Company model or simple metadata
            // For now, attaching to the user or ignoring if single-tenant assumption
        });

        return NextResponse.json(
            { message: 'Admin created successfully', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
