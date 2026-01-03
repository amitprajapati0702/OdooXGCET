
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import { authOptions } from '../../../api/auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const userId = session.user.id;
        
        // Get today's record
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const attendance = await Attendance.findOne({
            employeeId: userId,
            date: today
        });

        return NextResponse.json({ attendance });
    } catch (e) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const userId = session.user.id;
        const { action } = await req.json(); // 'checkIn' or 'checkOut'

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            employeeId: userId,
            date: today
        });

        const now = new Date();

        if (action === 'checkIn') {
            if (attendance) {
                return NextResponse.json({ message: 'Already checked in' }, { status: 400 });
            }
            attendance = await Attendance.create({
                employeeId: userId,
                date: today,
                checkIn: now,
                status: 'PRESENT'
            });
        } else if (action === 'checkOut') {
            if (!attendance || !attendance.checkIn) {
                return NextResponse.json({ message: 'No check-in record' }, { status: 400 });
            }
            
            attendance.checkOut = now;
            
            // Calculate Hours
            const diffMs = now.getTime() - new Date(attendance.checkIn).getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            attendance.workHours = parseFloat(diffHours.toFixed(2));
            
            // Logic: If < 6 hours, mark as LEAVE (or just status change)
            if (diffHours < 6) {
                attendance.status = 'LEAVE'; 
                // Note: User said "mark it as leave". 
                // We might also want to create a Leave record if they want it to show up in Leave module?
                // For now, setting status in Attendance is the primary request.
            } else {
                attendance.status = 'PRESENT';
                // Calculate extra hours if > 8 (assuming 8h standard)
                if (diffHours > 8) {
                    attendance.extraHours = parseFloat((diffHours - 8).toFixed(2));
                }
            }
            
            await attendance.save();
        }

        return NextResponse.json({ attendance });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
