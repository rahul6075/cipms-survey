import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },  // unique index auto-created
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "admin", "agent"], default: "agent" },
  created_by: { type: Schema.Types.ObjectId, ref: "User" },
  is_active: { type: Boolean, default: true },
}, { timestamps: true })

UserSchema.index({ role: 1, is_active: 1 })         // list all active agents/admins
UserSchema.index({ created_by: 1, role: 1 })        // agents created by a specific admin

const User = (mongoose.models?.User) ?? mongoose.model("User", UserSchema)
export default User
