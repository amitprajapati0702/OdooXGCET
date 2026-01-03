import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const isSelf = session.user.id === params.id;
        const isAdmin = session.user.role === 'ADMIN';

        if (!isSelf && !isAdmin) {
             return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!newPassword || newPassword.length < 6) {
             return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(params.id);

        if (!user) {
             return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify current password if self (admins might force reset without old pass - but for now lets require it or make optional for admin. 
        // User request "implement password change inside security section" usually implies standard flow.
        // Let's assume standard flow for self.
        
        if (!isAdmin || (isSelf && currentPassword)) {
            if (!user.password) {
                 // If user has no password (e.g. created via OAuth or imported), this flow might be tricky.
                 // But assuming normal creds flow.
                 return NextResponse.json({ message: 'User has no password set' }, { status: 400 });
            }
            
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                 return NextResponse.json({ message: 'Invalid current password' }, { status: 400 });
            }
        } else if (isAdmin && !isSelf) {
            // Admin resetting another user's password usually doesn't need old password.
            // But if admin is resetting their own, they need to provide old password above.
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.forcePasswordChange = false; // Reset flag if it was set
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
