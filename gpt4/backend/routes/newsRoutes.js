import express from "express";
import mongoose from "mongoose";
import News from "../models/News.js";

const router = express.Router();

// ✅ Create news
router.post("/", async (req, res) => {
  try {
    const {title, content, imageUrl } = req.body;

    const news = new News({title, content, imageUrl });
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    console.error("Error saving news:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Update news by ID
router.put("/:id", async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      { title, content, imageUrl },
      { new: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json(updatedNews);
  } catch (error) {
    console.error("Error updating news:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Delete news by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ message: error.message });
  }
});
 // ✅ Get list of likers for a post
router.get("/:id/likers", async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate("likes", "name email");
    if (!news) return res.status(404).json({ message: "News not found" });

    res.json(news.likes); // will return array of users who liked
  } catch (error) {
    console.error("Error fetching likers:", error);
    res.status(500).json({ message: error.message });
  }
});


// ✅ Like / Unlike a news post
router.put("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing userId" });
    }

    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });

    const alreadyLiked = news.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      news.likes = news.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
      news.likes.push(userId);
    }

    await news.save();

    res.json({ liked: !alreadyLiked, likes: news.likes });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
