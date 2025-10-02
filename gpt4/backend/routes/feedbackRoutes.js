import express from "express";
import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ POST feedback
router.post("/", async (req, res) => {
  try {
    const { userId, answers, message } = req.body;

    if (!userId || !answers) {
      return res.status(400).json({ error: "User ID and answers are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.type === "admin") {
      return res.status(403).json({ error: "Admins cannot submit feedback" });
    }

    const feedback = new Feedback({ userId, answers, message });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (err) {
    console.error("❌ Error saving feedback:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET all feedback (admins only)
router.get("/get", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId);
    if (!user || user.type !== "admin") {
      return res.status(403).json({ error: "Only admins can view feedback results" });
    }

    const feedbacks = await Feedback.find().populate("userId", "name email type");
    res.json(feedbacks);
  } catch (err) {
    console.error("❌ Error fetching feedbacks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
