import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure unique name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.name.split('.').pop();
        const filename = `avatar-${uniqueSuffix}.${ext}`;
        
        // Save to public/uploads
        // Note: In production this should be S3 or similar. Local FS is temp.
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        // We assume public/uploads exists or we create it. 
        // Best to check existence but for now assuming/try catch default
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);
        console.log(`Saved file to ${path}`);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
    }
}
