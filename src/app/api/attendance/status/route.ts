
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import { authOptions } from '../../../api/auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        
        // Date: Today
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Get all Attendance for today
        const attendances = await Attendance.find({
            date: today
        });

        // 2. Get all APPROVED Leaves covering today
        // (If fetching for just status display)
        const activeLeaves = await Leave.find({
            status: 'APPROVED',
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        // Map simplified status by EmployeeId
        const statusMap: Record<string, string> = {};

        // Priority 1: Leaves (User said: "if employee is on a leave... show as airplane")
        activeLeaves.forEach(l => {
            statusMap[l.employeeId.toString()] = 'LEAVE'; 
        });

        // Priority 2: Attendance (Overrides leave? Or Leave overrides attendance? 
        // Usually if on leave, they shouldn't check in. But if they DO check in, they are Present.
        // Let's say Attendance > Leave if they exist.
        attendances.forEach(a => {
            if (a.status === 'LEAVE') {
                 statusMap[a.employeeId.toString()] = 'LEAVE';
            } else if (a.status === 'PRESENT' || a.status === 'HALF_DAY') {
                 statusMap[a.employeeId.toString()] = 'PRESENT';
            }
        });
        
        // Absent is implicit if not in map.

        return NextResponse.json(statusMap);

    } catch (e) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
