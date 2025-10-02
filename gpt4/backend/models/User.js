import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  type: { type: String, enum: ["admin", "user"], default: "user" },

  // 👇 Auto-added fields, not shown in frontend signup
  address: { type: String, default: "" },
  gender: { type: String, default: "" },
  phone: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
