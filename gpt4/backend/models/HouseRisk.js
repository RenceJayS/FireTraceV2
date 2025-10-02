import mongoose from "mongoose";

const houseRiskSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  imageType: { type: String },
  address: { type: String, required: true },
  street: { type: String, required: false },
  houseNumber: { type: String, required: false },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  riskLevel: {
    type: String,
    enum: ["LOW", "MODERATE", "HIGH", null],
    default: null,
  },
  gptResult: { type: String },

  // ✅ Store only ObjectId reference
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: { type: Date, default: Date.now },
});

const HouseRisk = mongoose.model("HouseRisk", houseRiskSchema);
export default HouseRisk;
