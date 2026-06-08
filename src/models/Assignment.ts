import mongoose, { Schema } from "mongoose"

const AssignmentSchema = new Schema({
  form_id: { type: Schema.Types.ObjectId, ref: "Form", required: true },
  agent_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },  // unique index auto-created
  village: String,
  status: { type: String, enum: ["active", "expired", "revoked"], default: "active" },
  expires_at: Date,
  total_submissions: { type: Number, default: 0 },
  assigned_by: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

AssignmentSchema.index({ form_id: 1, agent_id: 1 })  // find all assignments for a form+agent
AssignmentSchema.index({ form_id: 1, status: 1 })    // active assignments per form
AssignmentSchema.index({ agent_id: 1 })              // all forms assigned to a Pradhan

const Assignment = (mongoose.models?.Assignment) ?? mongoose.model("Assignment", AssignmentSchema)
export default Assignment
