
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payslip from '@/models/Payslip';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { employeeId, month, year } = body;

        if (!employeeId || !month || !year) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // 1. Fetch User
        const user = await User.findById(employeeId);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const salary = user.salary || {};
        const wage = salary.wage || 0;
        const workingDaysPerWeek = salary.workingDays !== undefined ? salary.workingDays : 5;

        // 2. Define Date Range
        // JS Month is 0-indexed, but input 'month' is likely 1-12. Let's assume input is 1-based.
        const startOfMonth = new Date(year, month - 1, 1); // e.g. 2023-10-01
        const endOfMonth = new Date(year, month, 0); // Last day of month
        const daysInMonth = endOfMonth.getDate();

        // 3. Loop days to calculate status
        let totalWorkingDays = 0;
        let presentDays = 0;
        let approvedLeaveDays = 0;
        let unpaidDays = 0; // Absent or Unpaid Leave

        // Fetch all attendance for this range
        const attendanceRecords = await Attendance.find({
            employeeId: user._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Fetch all leaves that overlap with this range (simplified to start date in range for now, or check overlap)
        // Better: Find leaves where (start <= endOfMonth) and (end >= startOfMonth)
        const leaves = await Leave.find({
            employeeId: user._id,
            status: 'APPROVED',
            $or: [
                { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
                { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
                { startDate: { $lte: startOfMonth }, endDate: { $gte: endOfMonth } }
            ]
        });

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDay = new Date(year, month - 1, d);
            const dayOfWeek = currentDay.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

            // Determine if this is a working day based on profile config
            // Simple mapping: 5 days = Mon-Fri(1-5), 6 days = Mon-Sat(1-6)
            // If workingDays = 5, Day 1-5 is working. Day 6,0 is off.
            // If workingDays = 6, Day 1-6 is working. Day 0 is off.
            // If workingDays = 0, no work.
            let isWorkingDay = false;
            if (dayOfWeek === 0) {
                 isWorkingDay = false; // Always assume Sunday is off for simplicity unless 7
                 if (workingDaysPerWeek === 7) isWorkingDay = true;
            } else if (dayOfWeek <= workingDaysPerWeek) { 
                 // e.g. Mon(1) <= 5 -> True. Sat(6) <= 5 -> False.
                 isWorkingDay = true;
            }

            if (!isWorkingDay) continue; // Skip weekends/off days

            totalWorkingDays++;

            // CHECK 1: Attendance
            // Normalize currentDay to midnight UTC/Local consistency should match seed/attendance logic
            // Assuming simplified logic: check if ANY attendance matches this Y-M-D
            // In DB attendance date might be full ISO.
            const att = attendanceRecords.find(r => {
                const rDate = new Date(r.date);
                return rDate.getDate() === d && rDate.getMonth() === (month - 1) && rDate.getFullYear() === year;
            });

            if (att && att.status !== 'ABSENT') {
                presentDays++;
                continue; // Accounted for
            }

            // CHECK 2: Leaves
            // Check if currentDay falls inside any approved leave
            const leave = leaves.find(l => {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                // Reset times for dates comparison
                s.setHours(0,0,0,0);
                e.setHours(23,59,59,999);
                return currentDay >= s && currentDay <= e;
            });

            if (leave) {
                if (leave.type === 'PAID' || leave.type === 'SICK') {
                    approvedLeaveDays++;
                } else if (leave.type === 'UNPAID') {
                    unpaidDays++;
                }
            } else {
                // No Attendance AND No Leave => Absent (Treat as Unpaid)
                // BUT: User requirement: "If user ... do not check in ... automatically mark as leave ... and deduction"
                unpaidDays++; 
            }
        }

        // 4. Calculate Salary
        // Formula: Deduction = (Wage / 30) * UnpaidDays
        const dailyRate = wage / 30;
        const deductionAmount = Math.round(dailyRate * unpaidDays);
        const netSalary = Math.max(0, wage - deductionAmount);

        // 5. Create/Update Payslip
        const payslip = await Payslip.findOneAndUpdate(
            { employeeId: user._id, month, year },
            {
                wage,
                totalWorkingDays,
                presentDays,
                leaveDays: approvedLeaveDays,
                unpaidDays,
                deductionAmount,
                netSalary,
                status: 'DRAFT',
                generatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(payslip);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
