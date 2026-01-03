import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        await dbConnect();

        const user = await User.findById(id).select('-password');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const isSelf = session.user.id === params.id;
        const isAdmin = session.user.role === 'ADMIN';

        if (!isAdmin && !isSelf) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const body = await req.json();

        await dbConnect();

        let updateData = body;

        // If not admin, restrict fields
        if (!isAdmin) {
            // whitelist allowed fields
            const allowedFields = [
                'about', 
                'jobLove', 
                'hobbies', 
                'skills', 
                'certifications', 
                'avatar', 
                'phone', 
                'address',
                'location'
            ];
            
            updateData = {};
            allowedFields.forEach(field => {
                if (body[field] !== undefined) {
                    updateData[field] = body[field];
                }
            });
        }
        
        console.log(`Updating User ${id}. Admin: ${isAdmin}. Data:`, JSON.stringify(updateData));

        const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
        
        return NextResponse.json(updatedUser);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
