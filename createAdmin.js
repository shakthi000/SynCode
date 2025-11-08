// createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Replace this with your MongoDB URI
const MONGO_URI="mongodb+srv://shakthi:bhaskayS2@syncodecluster.lk1ee0g.mongodb.net/syncodecluster?retryWrites=true&w=majority";

// Define the user schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String, // "admin" or "user"
});

// Create User model
const User = mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("⚠️ Admin already exists:", existing.email);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: "adminn",
      email: "adminn@syncode.com",
      password: await bcrypt.hash("admin@123", 10), // hashed password
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log("Email: admin@syncode.com");
    console.log("Password: Admin@123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();
