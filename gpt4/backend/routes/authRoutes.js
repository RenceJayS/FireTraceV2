import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();
const SALT_ROUNDS = 10;

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid email or password." });

    res.json({
      message: "Sign in successful",
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, type: user.type },
    });
  } catch (err) {
    console.error("❌ Signin error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Profile image update
router.post("/uploadProfileImage", async (req, res) => {
  try {
    const { userId, image } = req.body;
    if (!userId || !image) return res.status(400).json({ error: "User ID and image URL are required." });

    const updatedUser = await User.findByIdAndUpdate(userId, { profileImage: image }, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "User not found." });

    res.json({ message: "Profile image updated successfully." });
  } catch (err) {
    console.error("❌ Profile image upload error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
