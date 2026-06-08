import mongoose, { Schema } from "mongoose"

const FieldSchema = new Schema({
  id: String,
  label: String,
  type: String,
  required: { type: Boolean, default: false },
  placeholder: String,
  options: [String],
  platforms: [String],
  constituency_config: {
    show_state: { type: Boolean, default: true },
    show_ls:    { type: Boolean, default: true },
    show_vs:    { type: Boolean, default: true },
  },
  maxFiles: Number,
  order: Number,
}, { _id: false })

const FormSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "active", "closed"], default: "draft" },
  access_type: { type: String, enum: ["public", "private", "restricted"], default: "public" },
  allowed_emails: [String],
  constituency: {
    lok_sabha_name: String,
    lok_sabha_no: Number,
    vidhan_sabha_name: String,
    vidhan_sabha_no: Number,
    state: String,
  },
  fields: [FieldSchema],
  require_consent: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
}, { timestamps: true })

FormSchema.index({ created_by: 1, status: 1 })         // admin's forms filtered by status
FormSchema.index({ status: 1, createdAt: -1 })          // all active forms sorted by date
FormSchema.index({ "constituency.lok_sabha_no": 1 })    // forms by constituency

// Delete cached model so schema changes (new fields like `platforms`) take effect on hot reload
if (mongoose.models?.Form) delete (mongoose.models as any).Form
const Form = mongoose.model("Form", FormSchema)
export default Form
