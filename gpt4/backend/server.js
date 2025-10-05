// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import newsRoutes from "./routes/newsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import houseRiskRoutes from "./routes/houseRiskRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN || "https://firetrace-capstone1.onrender.com" }));
app.use(express.json()); // ✅ Parse JSON bodies

// --- MongoDB Connection ---
mongoose.set("debug", true);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- Routes ---
app.use("/api/news", newsRoutes);          // Announcements & Events
app.use("/api/auth", authRoutes);          // Signup & Signin
app.use("/api/house-risk", houseRiskRoutes); // Fire Risk Houses
app.use("/api/feedbacks", feedbackRoutes); // Feedbacks
app.use("/api/users", userRoutes);         // ✅ User updates

// --- Fallback 404 ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start Server ---
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
