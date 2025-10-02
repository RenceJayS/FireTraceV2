import User from "../models/Users.js";
import bcrypt from "bcryptjs";

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user info (profile)
export const updateUser = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "firstName",
      "email",
      "address",
      "phone",
      "phone",
      "dob",
      "gender",
      "profileImage",
    ];

    // Build updates object only with provided values
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        if (field === "firstName") {
          updates.name = req.body[field]; // map firstName → name
        } else if (field === "phone") {
          updates.phone = req.body[field]; // map phone → cellphone
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// Update user password
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both current and new password are required" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
};
