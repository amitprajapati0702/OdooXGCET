import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check current user role
        const currentUserRole = (session.user as any).role;

        let query: any = {};

        // If current user is EMPLOYEE, they should not see ADMINs
        if (currentUserRole === 'EMPLOYEE') {
            query.role = { $ne: 'ADMIN' };
        }

        // Fetch users based on query
        const users = await User.find(query)
            .select('firstName lastName role jobPosition avatar attendance department')
            .sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // Strict Admin check
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { firstName, lastName, email, password, jobPosition, department } = body;

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        await dbConnect();

        // Check if email exists
        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
        }

        // Generate Custom Employee ID
        // OIJODO20220001
        const { generateEmployeeId } = await import('@/lib/idGenerator');
        const year = new Date().getFullYear();
        const employeeId = await generateEmployeeId(firstName, lastName, year);

        // Hash password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 10);

        const newUser = await User.create({
            employeeId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            jobPosition,
            department,
            role: 'EMPLOYEE',
            forcePasswordChange: true, // Force change on first login based on User request
        });

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Creation failed' }, { status: 500 });
    }
}
