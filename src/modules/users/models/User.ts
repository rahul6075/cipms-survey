import mongoose, { Schema } from "mongoose"

export const USER_STATUSES = ["active", "inactive", "invited", "suspended"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "admin", "agent"], default: "agent" },
  created_by: { type: Schema.Types.ObjectId, ref: "User" },

  // Legacy flag — kept so existing seed/API still work. Mirrored to `status`.
  is_active: { type: Boolean, default: true },

  // New fields for the users-at-scale redesign ────────────────
  status: { type: String, enum: USER_STATUSES, default: "active", index: true },
  profile_data: { type: Schema.Types.Mixed, default: {} },
  profile_complete: { type: Boolean, default: false, index: true },
  profile_percent: { type: Number, default: 0, min: 0, max: 100 },
  last_active_at: { type: Date },
}, { timestamps: true })

// Keep status + is_active in sync so existing writes still work ────
UserSchema.pre("save", function (next) {
  if (this.isModified("is_active") && !this.isModified("status")) {
    this.status = this.is_active ? "active" : "inactive"
  } else if (this.isModified("status") && !this.isModified("is_active")) {
    this.is_active = this.status === "active"
  }
  next()
})

UserSchema.index({ role: 1, is_active: 1 })
UserSchema.index({ created_by: 1, role: 1 })
UserSchema.index({ role: 1, status: 1, createdAt: -1 })
UserSchema.index({ name: "text", email: "text" })

// In dev, drop the cached model so schema edits take effect on HMR.
if (process.env.NODE_ENV !== "production" && mongoose.models?.User) {
  delete mongoose.models.User
}
const User = (mongoose.models?.User) ?? mongoose.model("User", UserSchema)
export default User
