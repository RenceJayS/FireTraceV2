import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import "../styles/feedback.css";

const questions = [
  "The system is easy to use.",
  "The analysis results are reliable.",
  "The recommendations are useful.",
  "The map helps me understand risks.",
  "I am satisfied with FireTrace.",
];

const Feedback = () => {
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [feedbackResults, setFeedbackResults] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    if (storedUser?.type === "admin") {
      fetchFeedbackResults(storedUser);
    }
  }, []);

  const fetchFeedbackResults = async (storedUser) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/feedbacks/get?userId=${storedUser._id || storedUser.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setFeedbackResults(data);
      } else {
        console.error("❌ Failed to fetch feedbacks");
      }
    } catch (err) {
      console.error("❌ Error fetching feedback results:", err);
    }
  };

  const handleAnswer = (q, rating) => {
    setAnswers({ ...answers, [q]: rating });
  };

  const handleSubmit = async () => {
    if (!user?._id && !user?.id) {
      alert("You must be logged in to send feedback.");
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      alert("⚠️ Please answer all 5 questions before submitting.");
      return;
    }

    const userId = user._id || user.id;

    const payload = {
      userId,
      answers: Object.keys(answers).map((q) => ({
        question: q,
        response: Number(answers[q]), // ensure numeric
      })),
      message,
    };

    try {
      console.log("Submitting feedback:", payload); // Debug log
      const res = await fetch("https://firetrace-backend.onrender.com/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to send feedback.");
        return;
      }

      alert("✅ Feedback submitted successfully!");
      setAnswers({});
      setMessage("");
    } catch (err) {
      console.error("❌ Backend error:", err);
    }
  };

  const renderStars = (q, rating) => (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${rating >= star ? "filled" : ""}`}
          onClick={() => handleAnswer(q, star)}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
     <main className={user?.type === "admin" ? "admin-feedback-container" : "user-feedback-container"}>
  {user?.type === "admin" ? (
    feedbackResults.length === 0 ? (
      <p className="no-feedback-text">No feedback submitted yet.</p>
    ) : (
      <div className="admin-feedback-card">
        <div className="table-wrapper">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>User</th>
                {questions.map((q, i) => <th key={i}>{q}</th>)}
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {feedbackResults.map((fb, idx) => (
                <tr key={idx}>
                  <td>{fb.userId?.name || "Anonymous"}</td>
                  {questions.map((q, i) => {
                    const answerObj = fb.answers.find(a => a.question === q);
                    return (
                      <td key={i}>
                        {answerObj?.response
                          ? "★".repeat(answerObj.response) + "☆".repeat(5 - answerObj.response)
                          : "-"}
                      </td>
                    );
                  })}
                  <td>{fb.message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  ) : (
    // user feedback card content here
          <div className="user-feedback-card">
            <h2>Please rate us</h2>
            {questions.map((q, idx) => (
              <div key={idx} className="feedback-question">
                <p>{q}</p>
                {renderStars(q, answers[q] || 0)}
              </div>
            ))}
            <textarea
              placeholder="Do you have any thoughts you’d like to share? (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="button" onClick={handleSubmit}>
              Submit Feedback
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Feedback;
