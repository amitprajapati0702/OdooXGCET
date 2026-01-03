

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars BEFORE importing files that might use them (like db.ts)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// We cannot use static imports here because they are hoisted and would run before dotenv.config()
// So we will import them dynamically inside the execution flow.

const SEED_ADMIN = {
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@dayflow.com',
    password: 'adminpassword',
    role: 'ADMIN',
    department: 'Management',
    jobPosition: 'Administrator'
};

const SEED_EMPLOYEES = [
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@dayflow.com',
        role: 'EMPLOYEE',
        department: 'Engineering',
        jobPosition: 'Frontend Developer',
        password: 'password123'
    },
    {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@dayflow.com',
        role: 'EMPLOYEE',
        department: 'HR',
        jobPosition: 'HR Manager',
        password: 'password123'
    }
];

async function seed() {
    // Dynamic imports to ensure env is loaded
    const { default: dbConnect } = await import('../lib/db');
    const { default: User } = await import('../models/User');
    const { generateEmployeeId } = await import('../lib/idGenerator');

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        await dbConnect();
        console.log('Connected.');

        // Clear existing Users? Uncomment to wipe
        // await User.deleteMany({});
        // console.log('Cleared existing users.');

        // Check if Admin exists
        const adminExists = await User.findOne({ email: SEED_ADMIN.email });
        if (!adminExists) {
            console.log('Creating Admin...');
            const hashedPassword = await bcrypt.hash(SEED_ADMIN.password, 10);
            const employeeId = await generateEmployeeId(SEED_ADMIN.firstName, SEED_ADMIN.lastName, new Date().getFullYear());

            await User.create({
                ...SEED_ADMIN,
                password: hashedPassword,
                employeeId,
                joiningDate: new Date(),
                forcePasswordChange: false // Admin shouldn't ideally be forced on seed
            });
            console.log(`Admin created! Email: ${SEED_ADMIN.email}, Password: ${SEED_ADMIN.password}, ID: ${employeeId}`);
        } else {
            console.log('Admin already exists.');
        }

        // Create Employees
        for (const emp of SEED_EMPLOYEES) {
            const exists = await User.findOne({ email: emp.email });
            if (!exists) {
                console.log(`Creating Employee ${emp.firstName}...`);
                const hashedPassword = await bcrypt.hash(emp.password, 10);
                const employeeId = await generateEmployeeId(emp.firstName, emp.lastName, new Date().getFullYear());

                await User.create({
                    ...emp,
                    password: hashedPassword,
                    employeeId,
                    joiningDate: new Date(),
                    forcePasswordChange: true // Test this flow
                });
                console.log(`Employee created! Email: ${emp.email}, Password: ${emp.password}, ID: ${employeeId}`);
            } else {
                console.log(`Employee ${emp.email} already exists.`);
            }
        }

        // Create Attendance for Employees (Mock Data for current month)
        const { default: Attendance } = await import('../models/Attendance');

        // Clear existing attendance for clean state if re-seeding
        // await Attendance.deleteMany({}); 

        const employees = await User.find({ role: 'EMPLOYEE' });
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        for (const emp of employees) {
            // Create records for the last 5 days
            for (let i = 0; i < 5; i++) {
                const date = new Date(year, month, today.getDate() - i);
                date.setHours(0, 0, 0, 0);

                // Skip weekends maybe? (0=Sun, 6=Sat)
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const exists = await Attendance.findOne({ employeeId: emp._id, date });
                if (!exists) {
                    const checkIn = new Date(date);
                    checkIn.setHours(9, 0, 0); // 9:00 AM

                    const checkOut = new Date(date);
                    checkOut.setHours(18, 0, 0); // 6:00 PM (9 hours)

                    await Attendance.create({
                        employeeId: emp._id,
                        date: date,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        status: 'PRESENT',
                        workHours: 9,
                        extraHours: 0
                    });
                    console.log(`Attendance logged for ${emp.firstName} on ${date.toDateString()}`);
                }
            }
        }

        // Create Leaves (Mock Data)
        const { default: Leave, LeaveStatus, LeaveType } = await import('../models/Leave');

        // Clear leaves
        // await Leave.deleteMany({});

        for (const emp of employees) {
            // Pending Leave
            const exists = await Leave.findOne({ employeeId: emp._id, status: 'PENDING' });
            if (!exists) {
                await Leave.create({
                    employeeId: emp._id,
                    type: 'Paid Time Off',
                    startDate: new Date(year, month, 28),
                    endDate: new Date(year, month, 28),
                    days: 1,
                    reason: 'Personal',
                    status: 'PENDING'
                });
                console.log(`Pending Leave created for ${emp.firstName}`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
