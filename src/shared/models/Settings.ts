import mongoose, { Schema } from "mongoose"

const SettingsSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "global" },
  default_intake_form_id: { type: Schema.Types.ObjectId, ref: "Form", default: null },
}, { timestamps: true })

if (process.env.NODE_ENV !== "production" && mongoose.models?.Settings) {
  delete mongoose.models.Settings
}
const Settings = (mongoose.models?.Settings) ?? mongoose.model("Settings", SettingsSchema)
export default Settings
