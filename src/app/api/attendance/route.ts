import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const month = searchParams.get('month'); // 1-12
        const year = searchParams.get('year'); // YYYY
        const employeeId = searchParams.get('employeeId');

        let query: any = {};

        // If Admin, can filter by any employee. If Employee, only self.
        const userRole = (session.user as any).role;
        const userId = (session.user as any).id;

        if (userRole === 'ADMIN') {
            if (employeeId) query.employeeId = employeeId;
        } else {
            query.employeeId = userId;
        }

        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            query.date = queryDate;
        } else if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.date = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }

        const records = await Attendance.find(query)
            .populate('employeeId', 'firstName lastName')
            .sort({ date: -1 });

        return NextResponse.json(records);
    } catch (e) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const body = await req.json();
        const { action } = body; // 'checkIn' or 'checkOut'

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({ employeeId: userId, date: today });

        if (action === 'checkIn') {
            if (attendance) {
                return NextResponse.json({ message: 'Already checked in' }, { status: 400 });
            }
            attendance = await Attendance.create({
                employeeId: userId,
                date: today,
                checkIn: new Date(),
                status: 'PRESENT'
            });
        } else if (action === 'checkOut') {
            if (!attendance) {
                return NextResponse.json({ message: 'No check-in found' }, { status: 400 });
            }
            attendance.checkOut = new Date();

            // Calculate hours
            const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
            const hours = diffMs / (1000 * 60 * 60);
            attendance.workHours = parseFloat(hours.toFixed(2));

            // Standard 9 hours
            if (hours > 9) {
                attendance.extraHours = parseFloat((hours - 9).toFixed(2));
            }

            await attendance.save();
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json(attendance);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
