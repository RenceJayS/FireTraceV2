import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        question: String,
        response: { type: Number, min: 1, max: 5 }, // ⭐ 1–5 star rating
      },
    ],
    message: { type: String },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema, "feedbacks");
export default Feedback;
