import mongoose, { Schema } from "mongoose"

const AssignmentSchema = new Schema({
  form_id: { type: Schema.Types.ObjectId, ref: "Form", required: true },
  agent_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  village: String,
  status: { type: String, enum: ["active", "expired", "revoked"], default: "active" },
  expires_at: Date,
  total_submissions: { type: Number, default: 0 },
  assigned_by: { type: Schema.Types.ObjectId, ref: "User" },
  // How this assignment was created. "intake" rows carry a snapshot of the
  // Pradhan's profile at creation time so the public survey header is stable
  // even if the user record is later edited or deactivated.
  created_via: { type: String, enum: ["manual", "intake"], default: "manual" },
  pradhan_snapshot: {
    name: String,
    photo: String,
    panchayat: String,
    block: String,
    district: String,
    state: String,
    phone: String,
    whatsapp: String,
    email: String,
  },
}, { timestamps: true })

AssignmentSchema.index({ form_id: 1, agent_id: 1 })  // find all assignments for a form+agent
AssignmentSchema.index({ form_id: 1, status: 1 })    // active assignments per form
AssignmentSchema.index({ agent_id: 1 })              // all forms assigned to a Pradhan

if (process.env.NODE_ENV !== "production" && mongoose.models?.Assignment) {
  delete mongoose.models.Assignment
}
const Assignment = (mongoose.models?.Assignment) ?? mongoose.model("Assignment", AssignmentSchema)
export default Assignment
