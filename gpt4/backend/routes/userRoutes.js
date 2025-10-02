import express from "express";
import {
  getUserById,
  updateUser,
  updatePassword,
} from "../controllers/userController.js";

const router = express.Router();

// Get user by ID
router.get("/:id", getUserById);

// Update user info (profile)
router.put("/:id", updateUser);

// Update password
router.put("/:id/password", updatePassword);

export default router;
