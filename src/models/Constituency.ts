import mongoose, { Schema } from "mongoose"

const ConstituencySchema = new Schema({
  lok_sabha_name: { type: String, required: true },
  lok_sabha_no: { type: Number, required: true },
  state: { type: String, required: true },
  vidhan_sabhas: [{ name: String, no: Number }],
})

const Constituency = (mongoose.models?.Constituency) ?? mongoose.model("Constituency", ConstituencySchema)
export default Constituency
