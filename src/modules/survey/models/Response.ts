import mongoose, { Schema } from "mongoose"
import { buildAnswerSearchKeys, SEARCH_KEY_VERSION } from "@/shared/lib/searchKey"

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
  /** Hindi/English-insensitive key per answer field, for text filters and search. */
  search_keys: { type: Map, of: String, default: undefined },
  search_keys_v: { type: Number },
  location: { lat: Number, lng: Number },
  device: { type: String, enum: ["mobile", "desktop"], default: "mobile" },
  synced_from_offline: { type: Boolean, default: false },
  submitted_at: { type: Date, default: Date.now },
}, { timestamps: true })

// Keep search keys in step with answers on every create/save.
ResponseSchema.pre("validate", function () {
  if (!this.isModified("answers") && this.search_keys_v === SEARCH_KEY_VERSION) return
  const answers = this.answers instanceof Map ? Object.fromEntries(this.answers) : (this.answers ?? {})
  this.set("search_keys", buildAnswerSearchKeys(answers as Record<string, unknown>))
  this.set("search_keys_v", SEARCH_KEY_VERSION)
})

// Indexes for fast querying at scale
ResponseSchema.index({ form_id: 1, submitted_at: -1 })   // responses per form, sorted by time
ResponseSchema.index({ form_id: 1, search_keys_v: 1 })   // finds responses whose search keys need (re)building
ResponseSchema.index({ form_id: 1, agent_id: 1, submitted_at: -1 }) // per-form responses for one Pradhan
ResponseSchema.index({ agent_id: 1, submitted_at: -1 })  // responses per Gram Pradhan
ResponseSchema.index({ assignment_id: 1 })               // responses per assignment token
ResponseSchema.index({ "constituency.lok_sabha_no": 1 }) // filter by constituency
ResponseSchema.index({ submitted_at: -1 })               // global time-based queries

// Dev only: drop the cached model so schema edits take effect on hot reload.
if (process.env.NODE_ENV !== "production" && mongoose.models.Response) mongoose.deleteModel("Response")
const Response = mongoose.models.Response || mongoose.model("Response", ResponseSchema)
export default Response
