const mongoose = require("mongoose");

const connectionString =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dayflow-hrms";

async function testRead() {
  try {
    await mongoose.connect(connectionString);

    // Generic schema to read everything
    const User = mongoose.model(
      "UserRead",
      new mongoose.Schema({}, { strict: false }),
      "users"
    );

    const user = await User.findOne({ email: "admin@dayflow.com" });
    console.log("User Salary Data:", JSON.stringify(user.salary, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

testRead();
