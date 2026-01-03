const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb://localhost:27017/dayflow-hrms";

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, default: "EMPLOYEE" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    department: { type: String },
    jobPosition: { type: String },
    forcePasswordChange: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"],
      default: "PRESENT",
    },
    workHours: { type: Number, default: 0 },
    extraHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const LeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String },
    status: { type: String, default: "PENDING" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
const Leave = mongoose.model("Leave", LeaveSchema);

// --- DATA ---
const SEED_ADMIN = {
  firstName: "System",
  lastName: "Admin",
  email: "admin@dayflow.com",
  password: "adminpassword",
  role: "ADMIN",
  department: "Management",
  jobPosition: "Administrator",
};

const SEED_EMPLOYEES = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john@dayflow.com",
    role: "EMPLOYEE",
    department: "Engineering",
    jobPosition: "Frontend Developer",
    password: "password123",
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@dayflow.com",
    role: "EMPLOYEE",
    department: "HR",
    jobPosition: "HR Manager",
    password: "password123",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Create Admin
    let admin = await User.findOne({ email: SEED_ADMIN.email });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(SEED_ADMIN.password, 10);
      const employeeId = "EMP-" + new Date().getFullYear() + "-001";
      admin = await User.create({
        ...SEED_ADMIN,
        password: hashedPassword,
        employeeId,
        joiningDate: new Date(),
      });
      console.log("Admin created");
    } else {
      console.log("Admin already exists");
    }

    // 2. Create Employees
    for (let i = 0; i < SEED_EMPLOYEES.length; i++) {
      const empData = SEED_EMPLOYEES[i];
      let emp = await User.findOne({ email: empData.email });
      if (!emp) {
        const hashedPassword = await bcrypt.hash(empData.password, 10);
        const employeeId = "EMP-" + new Date().getFullYear() + "-00" + (i + 2);
        emp = await User.create({
          ...empData,
          password: hashedPassword,
          employeeId,
          joiningDate: new Date(),
        });
        console.log(`Employee ${emp.firstName} created`);
      } else {
        console.log(`Employee ${emp.firstName} already exists`);
      }
    }

    // 3. Create Attendance (Last 5 days for all employees)
    const employees = await User.find({ role: "EMPLOYEE" });
    const today = new Date();

    for (const emp of employees) {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);

        if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

        const exists = await Attendance.findOne({ employeeId: emp._id, date });
        if (!exists) {
          const checkIn = new Date(date);
          checkIn.setHours(9, 0, 0);
          const checkOut = new Date(date);
          checkOut.setHours(18, 0, 0);

          await Attendance.create({
            employeeId: emp._id,
            date,
            checkIn,
            checkOut,
            status: "PRESENT",
            workHours: 9,
          });
          console.log(
            `Attendance logged for ${emp.firstName} on ${date.toDateString()}`
          );
        }
      }
    }

    // 4. Create Leaves
    for (const emp of employees) {
      const leaveExists = await Leave.findOne({
        employeeId: emp._id,
        status: "PENDING",
      });
      if (!leaveExists) {
        await Leave.create({
          employeeId: emp._id,
          type: "Paid Time Off",
          startDate: new Date(today.getFullYear(), today.getMonth(), 28),
          endDate: new Date(today.getFullYear(), today.getMonth(), 28),
          days: 1,
          reason: "Personal Request",
          status: "PENDING",
        });
        console.log(`Leave request created for ${emp.firstName}`);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
