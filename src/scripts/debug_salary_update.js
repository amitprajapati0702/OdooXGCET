const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionString =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dayflow-hrms";

async function testUpdate() {
  try {
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB");

    // Define schema essentially matching User.ts to ensure it works
    const UserSchema = new Schema(
      {
        email: String,
        salary: {
          wage: { type: Number, default: 0 },
          workingDays: { type: Number, default: 5 },
          breakTime: { type: Number, default: 1 },
          basic: { type: Number, default: 0 },
          // ... other fields simplified
        },
      },
      { strict: false }
    ); // Strict false to allow other fields

    // Use a different model name to avoid conflicts if any
    const User = mongoose.model("UserTest", UserSchema, "users");

    // Find the admin user or any user
    const user = await User.findOne({ email: "admin@dayflow.com" });
    if (!user) {
      console.log("Admin user not found");
      return;
    }
    console.log("Found User:", user._id);
    console.log("Current Salary:", user.salary);

    // Update Salary
    const newSalary = {
      wage: 60000,
      workingDays: 5,
      breakTime: 1,
      basic: 30000,
    };

    const res = await User.findByIdAndUpdate(
      user._id,
      { salary: newSalary },
      { new: true }
    );
    console.log("Updated User Salary:", res.salary);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

testUpdate();
