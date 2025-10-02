import React, { useState, useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useNavigate } from "react-router-dom";
import "../styles/doubleslider.css";
import backImage from "../assets/back.png";
import logo from "../assets/logo.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // <-- make sure this is at the top


export default function DoubleSlider() {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [signUpForm, setSignUpForm] = useState({ name: "", email: "", password: "" });
  const [signUpMessage, setSignUpMessage] = useState("");

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signInMessage, setSignInMessage] = useState("");

  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false); // ✅ popup state
  const [tempUserData, setTempUserData] = useState(null); // ✅ store user temporarily

  const navigate = useNavigate();

  const toggleActive = useCallback(() => {
    setIsSignUpActive((prev) => !prev);
    setSignUpMessage("");
    setSignInMessage("");
  }, []);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const handleSignUpChange = useCallback((e) => {
    const { name, value } = e.target;
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSignUp = useCallback(
    async (e) => {
      e.preventDefault();
      setSignUpMessage("");
      try {
        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signUpForm),
        });

        const data = await response.json();
        if (response.ok) {
          setSignUpMessage("✅ Signup successful! You can now sign in.");
          setSignUpForm({ name: "", email: "", password: "" });
          setIsSignUpActive(false);
        } else {
          setSignUpMessage(`❌ ${data.error || "Signup failed."}`);
        }
      } catch {
        setSignUpMessage("❌ Network error. Try again.");
      }
    },
    [signUpForm]
  );

  const handleSignInChange = useCallback((e) => {
    const { name, value } = e.target;
    setSignInForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSignIn = useCallback(
    async (e) => {
      e.preventDefault();
      setSignInMessage("");
      try {
        const response = await fetch("http://localhost:5000/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signInForm),
        });

        const data = await response.json();
        if (response.ok) {
          setSignInMessage("✅ Sign in successful!");

          // ✅ store temp data, show popup
          setTempUserData(data);
          setShowPrivacyPopup(true);
        } else {
          setSignInMessage(`❌ ${data.error || "Sign in failed."}`);
        }
      } catch {
        setSignInMessage("❌ Network error. Try again.");
      }
    },
    [signInForm]
  );

// ✅ Handle privacy agreement
const handleAgree = () => {
  if (tempUserData) {
    if (tempUserData.user) {
      const userWithType = { 
        ...tempUserData.user, 
        type: tempUserData.user.type || "user" 
      };

      // ✅ Save whole user object
      localStorage.setItem("user", JSON.stringify(userWithType));

      // ✅ Also save userId and userType separately
      localStorage.setItem("userId", userWithType._id);
      localStorage.setItem("userType", userWithType.type);
    } else {
      const fallbackUser = { email: signInForm.email, type: "user" };
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      localStorage.setItem("userType", "user");
    }

    if (tempUserData.token) {
      localStorage.setItem("token", tempUserData.token);
    }
  }

  setSignInForm({ email: "", password: "" });
  setShowPrivacyPopup(false);
  navigate("/dashboard", { replace: true });
};
 

  const handleDisagree = () => {
    setShowPrivacyPopup(false);
    setTempUserData(null);
    setSignInMessage("❌ You must agree to the privacy policy to continue.");
  };

  const leftParticlesOptions = {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 20 },
      size: { value: { min: 3, max: 6 } },
      move: { enable: true, speed: 0.6, direction: "top", outModes: { default: "out" }, random: true },
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      color: { value: "#ff9646" },
      links: { enable: false },
    },
  };

  const rightParticlesOptions = {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 20 },
      size: { value: { min: 3, max: 6 } },
      move: { enable: true, speed: 0.6, direction: "bottom", outModes: { default: "out" }, random: true },
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      color: { value: "#ff9646" },
      links: { enable: false },
    },
  };

  return (
    <div
      className="slider-wrapper"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url(${backImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Particles */}
      <Particles id="tsparticles-left" init={particlesInit} options={leftParticlesOptions}
        style={{ position: "absolute", top: 0, left: 0, width: "20%", height: "100%", zIndex: 0, pointerEvents: "none" }}
      />
      <Particles id="tsparticles-right" init={particlesInit} options={rightParticlesOptions}
        style={{ position: "absolute", top: 0, right: 0, width: "20%", height: "100%", zIndex: 0, pointerEvents: "none" }}
      />

      {/* Container */}
      <div className={`container2 ${isSignUpActive ? "right-panel-active" : ""}`}
        style={{
          position: "relative",
          zIndex: 1,
          boxShadow: "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
          borderRadius: "10px",
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "3rem",
          width: "1000px",
          maxWidth: "100%",
          minHeight: "600px",
          display: "flex",
          overflow: "hidden",
        }}
      >
      <div className="form-container2 sign-up-container2" style={{ flex: 1, padding: "2rem" }}>
  <form onSubmit={handleSignUp}>
    <img src={logo} alt="Logo" style={{ width: "80px", marginBottom: "10px" }} />
    <h1>Create Account</h1>
    <input
      type="text"
      name="name"
      placeholder="Name"
      value={signUpForm.name}
      onChange={handleSignUpChange}
      required
    />
    <input
      type="email"
      name="email"
      placeholder="Email"
      value={signUpForm.email}
      onChange={handleSignUpChange}
      required
    />
    <div className="password-wrapper">
      <input
        type={showSignUpPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={signUpForm.password}
        onChange={handleSignUpChange}
        required
        minLength={6}
        style={{ paddingRight: "40px" }} // space for eye icon
      />
      <button
        type="button"
        className="eye-icon2"
        onClick={() => setShowSignUpPassword(prev => !prev)}
        tabIndex={-1}
      >
        {showSignUpPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
      </button>
    </div>
    <button type="submit">Sign Up</button>
    {signUpMessage && (
      <p style={{ marginTop: "10px", color: signUpMessage.startsWith("✅") ? "green" : "red" }}>
        {signUpMessage}
      </p>
    )}
  </form>
</div>

{/* Sign In */}
<div className="form-container2 sign-in-container2" style={{ flex: 1, padding: "2rem" }}>
  <form onSubmit={handleSignIn}>
    <img src={logo} alt="Logo" style={{ width: "80px", marginBottom: "10px" }} />
    <h1>Sign in</h1>
    <input
      type="email"
      name="email"
      placeholder="Email"
      value={signInForm.email}
      onChange={handleSignInChange}
      required
    />
    <div className="password-wrapper">
      <input
        type={showSignInPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={signInForm.password}
        onChange={handleSignInChange}
        required
        style={{ paddingRight: "40px" }}
      />
      <button
        type="button"
        className="eye-icon2"
        onClick={() => setShowSignInPassword(prev => !prev)}
        tabIndex={-1}
      >
        {showSignInPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
      </button>
    </div>
    <button type="submit">Sign In</button>
    {signInMessage && (
      <p style={{ marginTop: "10px", color: signInMessage.startsWith("✅") ? "green" : "red" }}>
        {signInMessage}
      </p>
    )}
  </form>
</div>

        {/* Overlay */}
        <div className="overlay-container2">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Let’s get you back in!</h1>
              <p>To keep connected, please login with your personal info</p>
              <button className="ghost" onClick={toggleActive}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Create your account</h1>
              <p>Sign up to get started with all our features and tools</p>
              <button className="ghost" onClick={toggleActive}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Privacy Popup */}
      {showPrivacyPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", padding: "2rem", borderRadius: "10px",
            maxWidth: "500px", textAlign: "center", boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
          }}>
            <h2>Privacy Policy</h2>
            <p style={{ margin: "1rem 0", fontSize: "14px", lineHeight: "1.5" }}>
              By using FireTrace, you consent to the collection and processing of your images and data for fire hazard assessment. 
              Your information will be kept secure and used only for this purpose. 
              FireTrace provides safety recommendations but cannot guarantee complete fire prevention. 
              By continuing, you accept these terms.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={handleAgree} style={{ marginRight: "10px", padding: "10px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px" }}>
                I Agree & Continue
              </button>
              <button onClick={handleDisagree} style={{ padding: "10px 20px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "5px" }}>
                Disagree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
