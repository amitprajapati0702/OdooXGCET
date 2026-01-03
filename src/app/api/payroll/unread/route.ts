
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Payslip from '@/models/Payslip';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // Find latest payslip for this user that has deductions > 0 and NOT viewed
        const payslip = await Payslip.findOne({
            employeeId: session.user.id,
            deductionAmount: { $gt: 0 },
            viewedByEmployee: false
        }).sort({ createdAt: -1 });

        return NextResponse.json({ payslip }); // Returns null or obj
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
