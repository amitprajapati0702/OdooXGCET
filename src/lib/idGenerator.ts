import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function generateEmployeeId(firstName: string, lastName: string, year: number) {
    // Format: OI + 2 letters FName + 2 letters LName + Year + Serial
    // OIJODO20220001

    const f = firstName.substring(0, 2).toUpperCase();
    const l = lastName.substring(0, 2).toUpperCase();
    const prefix = `OI${f}${l}${year}`;

    // Find latest ID for this year to increment serial
    // Actually, standard practice for "Serial Number of Joining for that Year"
    // means we need to count how many joined that year? Or just global serial?
    // Let's assume Global Serial or reset per year? 
    // "0001 Serial Number of Joining for that Year" implies reset per year.

    // We can do a Regex search for the specific year part to find the max.
    // Or keep a separate counter collection. 
    // For simplicity and speed without extra collection:
    // Find users whose employeeId matches the pattern for that year.

    await dbConnect();

    // Pattern: ^OI....<year>....$
    // Actually the prefix changes based on name! 
    // So we can't just search by prefix. We need search by Year part?
    // "0001 Serial Number of Joining for that Year" -> This usually means the 1st person joined in 2022, 2nd in 2022.
    // It effectively means standard serial for the year.

    // Let's search for any ID containing that year at that position?
    // Or just count documents created in that year?
    // Safer: Get count of users checked in that year? 
    // No, easiest is to find the last created user in that year and parse, but names differ.

    // Wait, if the format includes name chars, the ID is unique per person structure.
    // But the serial 0001... is it global for the year or specific to that prefix?
    // "Serial Number of Joining for that Year" -> usually Global for the year.
    // So: OIJODO20220001, separate person: OIMISM20220002.
    // YES.

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const count = await User.countDocuments({
        createdAt: { $gte: startOfYear, $lt: endOfYear }
    });

    const serial = (count + 1).toString().padStart(4, '0');

    return `${prefix}${serial}`;
}
