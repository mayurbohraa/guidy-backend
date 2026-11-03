import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "issued", "completed"], default: "pending" },
  issuedAt: Date,
  expiresAt: Date,
}, { timestamps: true });
export default mongoose.model("recoveryRequest", schema);

const limitSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, expires: 0 },
});
export const recoveryLimit = mongoose.model("recoveryLimit", limitSchema);
