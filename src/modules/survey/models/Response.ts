import mongoose, { Schema } from "mongoose"

const ResponseSchema = new Schema({
  form_id: { type: Schema.Types.ObjectId, ref: "Form", required: true },
  assignment_id: { type: Schema.Types.ObjectId, ref: "Assignment" },
  agent_id: { type: Schema.Types.ObjectId, ref: "User" },
  constituency: {
    lok_sabha_name: String,
    lok_sabha_no: Number,
    vidhan_sabha_name: String,
    vidhan_sabha_no: Number,
    state: String,
  },
  submitter_info: {
    name: String,
    phone: String,
    village: String,
  },
  answers: { type: Map, of: Schema.Types.Mixed },
  location: { lat: Number, lng: Number },
  device: { type: String, enum: ["mobile", "desktop"], default: "mobile" },
  synced_from_offline: { type: Boolean, default: false },
  submitted_at: { type: Date, default: Date.now },
}, { timestamps: true })

// Indexes for fast querying at scale
ResponseSchema.index({ form_id: 1, submitted_at: -1 })   // responses per form, sorted by time
ResponseSchema.index({ agent_id: 1, submitted_at: -1 })  // responses per Gram Pradhan
ResponseSchema.index({ assignment_id: 1 })               // responses per assignment token
ResponseSchema.index({ "constituency.lok_sabha_no": 1 }) // filter by constituency
ResponseSchema.index({ submitted_at: -1 })               // global time-based queries

const Response = (mongoose.models?.Response) ?? mongoose.model("Response", ResponseSchema)
export default Response
