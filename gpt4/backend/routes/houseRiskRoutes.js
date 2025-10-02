// backend/routes/houseRiskRoutes.js
import express from "express";
import HouseRisk from "../models/HouseRisk.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * ✅ POST /api/house-risk/post
 * Create a new house risk record
 */
router.post("/post", async (req, res) => {
  try {
    const {
      imageUrl,
      address,
      coordinates,
      riskLevel,
      gptResult,
      street,
      houseNumber,
      imageType,
      uploadedBy,
    } = req.body;

    if (!uploadedBy) {
      return res.status(400).json({ error: "Uploader ID required." });
    }

    // ✅ Ensure uploader exists
    const user = await User.findById(uploadedBy).select("_id name email type");
    if (!user) {
      return res.status(404).json({ error: "Uploader not found." });
    }

    // ✅ Create new record
    const newRecord = new HouseRisk({
      imageUrl,
      address,
      coordinates,
      riskLevel,
      gptResult,
      street,
      houseNumber,
      imageType,
      uploadedBy: user._id,
    });

    await newRecord.save();

    const populatedRecord = await newRecord.populate("uploadedBy", "name email type");

    res.status(201).json({
      message: "House risk saved successfully",
      data: populatedRecord,
    });
  } catch (err) {
    console.error("❌ Error saving house risk:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * ✅ GET /api/house-risk/all
 * Fetch houses — Admin sees all, User sees only their uploads
 */
router.get("/all", async (req, res) => {
  try {
    const { userId, userType } = req.query;
    let query = {};

    if (userType !== "admin" && userId) {
      query.uploadedBy = userId;
    }

    const allHouses = await HouseRisk.find(query)
      .populate("uploadedBy", "name email type")
      .sort({ createdAt: -1 });

    res.json(allHouses);
  } catch (err) {
    console.error("❌ Error fetching houses:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ DELETE /api/house-risk/:id
 * Delete a house risk record (Admin or uploader only)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.query;

    const house = await HouseRisk.findById(id);
    if (!house) {
      return res.status(404).json({ error: "House not found" });
    }

    // ✅ Authorization check
    if (userType !== "admin" && house.uploadedBy.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this record" });
    }

    await house.deleteOne();

    res.json({ message: "House deleted successfully", id });
  } catch (err) {
    console.error("❌ Error deleting house:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
