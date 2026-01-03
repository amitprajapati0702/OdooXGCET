import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Leave, { LeaveStatus } from '@/models/Leave';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const statusFunc = searchParams.get('status'); // 'pending' or 'history'

        await dbConnect();
        const role = session.user.role;
        const userId = session.user.id;

        let query: any = {};

        // If Employee, always stick to own ID
        if (role !== 'ADMIN') {
            query.employeeId = userId;
        }

        // Filter based on Tab context
        if (statusFunc === 'pending') {
            query.status = 'PENDING';
        } else if (statusFunc === 'history') {
            query.status = { $ne: 'PENDING' };
        } 
        // If statusFunc is 'all' or null for employees who want to see everything, we don't add status filter (except maybe employeeId)

        const leaves = await Leave.find(query)
            .populate('employeeId', 'firstName lastName')
            .sort({ createdAt: -1 });

        return NextResponse.json(leaves);
    } catch (e) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const userId = session.user.id;
        const body = await req.json();

        // Handle "UPDATE STATUS" (Approve/Reject)
        if (body.action === 'updateStatus') {
            if (session.user.role !== 'ADMIN') {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            const { leaveId, status } = body;

            // Logic: Update status. If approved, deduct leave credits?
            // Simplification: Just update status for now. 
            // In real app: atomic transaction to check balance and deduct.

            const leave = await Leave.findByIdAndUpdate(leaveId, {
                status,
                approvedBy: userId
            }, { new: true });

            // If approved, decrement credit
            if (status === 'APPROVED') {
                const user = await User.findById(leave.employeeId);
                if (user) {
                    let field: 'paid' | 'sick' | 'unpaid' | '' = '';
                    if (leave.type === 'Paid Time Off') field = 'paid';
                    if (leave.type === 'Sick Leave') field = 'sick';
                    if (leave.type === 'Unpaid Leave') field = 'unpaid';

                    if (field) {
                        // Deduct days. We allow negative for now to prevent blocking if data is out of sync.
                        if (!user.leaveCredits) user.leaveCredits = { paid: 0, sick: 0, unpaid: 0 };
                        
                        // Ensure it's treated as number
                        const currentCredit = user.leaveCredits[field] || 0;
                        user.leaveCredits[field] = currentCredit - leave.days;
                        
                        // Mark as modified if necessary (Mongoose sometimes needs this for nested objects)
                        user.markModified('leaveCredits');
                        await user.save();
                    }
                }
            }
            return NextResponse.json(leave);
        }

        // Handle "CREATE REQUEST"
        const { type, startDate, endDate, days, reason } = body;

        // Basic validation: Check if user has credits? 
        // We will do simple creation.

        const newLeave = await Leave.create({
            employeeId: userId,
            type,
            startDate,
            endDate,
            days,
            reason,
            status: LeaveStatus.PENDING
        });

        return NextResponse.json(newLeave, { status: 201 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
