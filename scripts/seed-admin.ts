/**
 * Run: npx tsx scripts/seed-admin.ts
 * Creates the first Super Admin user
 */
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://..."

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  is_active: { type: Boolean, default: true },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model("User", UserSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  const hashed = await bcrypt.hash("Admin@123", 10)
  await User.findOneAndUpdate(
    { email: "admin@cipms.in" },
    { name: "Super Admin", email: "admin@cipms.in", password: hashed, role: "super_admin" },
    { upsert: true }
  )
  console.log("✅ Super Admin created: admin@cipms.in / Admin@123")
  await mongoose.disconnect()
}

seed().catch(console.error)
