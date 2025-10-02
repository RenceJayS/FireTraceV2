import bcrypt from "bcrypt";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();
    return res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("❌ Error in signup:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
      message: "Sign in successful",
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, type: user.type },
    });
  } catch (err) {
    console.error("❌ Error in signin:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
