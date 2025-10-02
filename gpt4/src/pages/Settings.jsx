    // Settings.jsx
    import React, { useState, useEffect } from "react";
    import axios from "axios";
    import "../styles/settings.css";
    import profilePlaceholder from "../assets/placeholder.png";
    import { MdPerson, MdLock } from "react-icons/md";
    import cameraIcon from "../assets/camera.png"; // adjust the path based on your file structure
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // <-- make sure this is at the top


    

    const Settings = () => {
      const [activeTab, setActiveTab] = useState("personal");
      const [profileImg, setProfileImg] = useState(profilePlaceholder);
      const [loading, setLoading] = useState(false);
const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);

      const [formData, setFormData] = useState({
        name: "",
        email: "",
        address: "",
        phone: "",
        gender: "",
      });

      const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Cloudinary settings – replace with your actual Cloudinary info
      const CLOUD_NAME = "dlmrcsaqf"; // ✅ Your Cloudinary cloud name
      const UPLOAD_PRESET = "unsigned_preset"; // ✅ Your unsigned upload preset

      const getUserId = () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser._id || parsedUser.id || null;
        }
        return null;
      };

      // Fetch user info
      useEffect(() => {
        const userId = getUserId();
        if (!userId) return console.warn("⚠️ No userId found in localStorage");

        const fetchUser = async () => {
          try {
            const res = await axios.get(`http://localhost:5000/api/users/${userId}`);
            const user = res.data;
            setFormData({
              name: user.name || "",
              email: user.email || "",
              address: user.address || "",
              phone: user.phone || "",
              gender: user.gender || "",
            });
            setProfileImg(user.profileImage || profilePlaceholder);
          } catch (err) {
            console.error("❌ Error fetching user:", err);
          }
        };

        fetchUser();
      }, []);

      const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

      const handlePasswordChange = (e) =>
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

      const validateForm = () => {
        if (!formData.name.trim()) return "Name cannot be empty";
        if (!formData.email.trim() || !formData.email.includes("@"))
          return "Enter a valid email";
        if (!formData.phone.trim()) return "Phone cannot be empty";
        return null;
      };

      const handleSave = async () => {
        const userId = getUserId();
        if (!userId) return alert("User ID not found!");

        const validationError = validateForm();
        if (validationError) return alert(`⚠️ ${validationError}`);

        try {
          setLoading(true);
          const res = await axios.put(
            `http://localhost:5000/api/users/${userId}`,
            { ...formData }
          );
          localStorage.setItem("user", JSON.stringify(res.data.user || res.data));
          alert("✅ Profile updated successfully!");
        } catch (err) {
          console.error("❌ Update failed:", err);
          alert("Failed to update profile.");
        } finally {
          setLoading(false);
        }
      };

      // Upload profile image
      const handleImageChange = async (e) => {
        const userId = getUserId();
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setProfileImg(URL.createObjectURL(file));

        const formDataCloud = new FormData();
        formDataCloud.append("file", file);
        formDataCloud.append("upload_preset", UPLOAD_PRESET);

        try {
          setLoading(true);
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: formDataCloud }
          );

          const data = await res.json();
          if (!res.ok || data.error)
            throw new Error(data.error?.message || "Cloudinary upload failed");

          const imageUrl = data.secure_url;

          if (userId) {
            const userRes = await axios.put(`http://localhost:5000/api/users/${userId}`, {
              profileImage: imageUrl,
            });
            setProfileImg(imageUrl);
            localStorage.setItem("user", JSON.stringify(userRes.data.user || userRes.data));
          }
        } catch (err) {
          console.error("❌ Image upload failed:", err);
          alert("Failed to upload image.");
          setProfileImg(profilePlaceholder);
        } finally {
          setLoading(false);
        }
      };

      const validatePassword = () => {
        if (!passwordData.currentPassword) return "Enter current password";
        if (!passwordData.newPassword || passwordData.newPassword.length < 6)
          return "New password must be at least 6 characters";
        if (passwordData.newPassword !== passwordData.confirmPassword)
          return "New passwords do not match";
        return null;
      };

      const handlePasswordSave = async () => {
        const userId = getUserId();
        if (!userId) return alert("User ID not found!");

        const validationError = validatePassword();
        if (validationError) return alert(`⚠️ ${validationError}`);

        try {
          setLoading(true);
          await axios.put(`http://localhost:5000/api/users/${userId}/password`, {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          });
          alert("✅ Password updated successfully!");
          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
          console.error("❌ Password update failed:", err);
          alert("Failed to update password.");
        } finally {
          setLoading(false);
        }
      };

    return (
      <div className="settings-wrapper">
        <div className="settings-panel">
          <div className="profile-card" style={{ textAlign: "center" }}>
            
            {/* Profile Picture Wrapper */}
            <div className="profile-wrapper">
      <div className="profile-img">
        <img src={profileImg} alt="Profile" />
      </div>

      {/* Hidden File Input */}
      <input
        id="imgUpload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      {/* Camera Icon Button */}
      <button
        className="camera-btn"
        onClick={() => document.getElementById("imgUpload").click()}
      >
        <img src={cameraIcon} alt="Change" />
      </button>
            </div>

            {/* Name */}
            <h3 className="profile-name" style={{ marginTop: "16px" }}>
              {formData.name || "Your Name"}
            </h3>
            <div className="tabs">
      <button 
        className={`tab ${activeTab === "personal" ? "active-tab" : ""}`} 
        onClick={() => setActiveTab("personal")}
      >
        <MdPerson size={18} />
        Personal Information
      </button>

      <button 
        className={`tab ${activeTab === "password" ? "active-tab" : ""}`} 
        onClick={() => setActiveTab("password")}
      >
        <MdLock size={18} />
        Password
      </button>
    </div>
            </div>
          </div>

          <main className="form-section1">
            <div className="form-container">
              {activeTab === "personal" ? (
                <>
                  <h2 className="form-title1">Personal Information</h2>
                  <div className="form-row1"><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" /></div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
                  <div className="form-row1"><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" /></div>
                  <button className="save-button" onClick={handleSave} disabled={loading}>Save Changes</button>
                </>
              ) : (
                <>
  <h2 className="form-title">Change Password</h2>
  <p className="subheading"></p>

  {/* Current Password */}
  <div className="password-wrapper">
    <input
      type={showCurrent ? "text" : "password"}
      name="currentPassword"
      value={passwordData.currentPassword}
      onChange={handlePasswordChange}
      placeholder="Enter Current Password"
      style={{ paddingRight: "40px" }}
    />
    <button
      type="button"
      className="eye-icon"
      onClick={() => setShowCurrent(prev => !prev)}
      tabIndex={-1}
    >
      {showCurrent ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
    </button>
  </div>

  {/* New Password */}
  <div className="password-wrapper">
    <input
      type={showNew ? "text" : "password"}
      name="newPassword"
      value={passwordData.newPassword}
      onChange={handlePasswordChange}
      placeholder="Enter New Password"
      style={{ paddingRight: "40px" }}
    />
    <button
      type="button"
      className="eye-icon"
      onClick={() => setShowNew(prev => !prev)}
      tabIndex={-1}
    >
      {showNew ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
    </button>
  </div>

  {/* Confirm Password */}
  <div className="password-wrapper">
    <input
      type={showConfirm ? "text" : "password"}
      name="confirmPassword"
      value={passwordData.confirmPassword}
      onChange={handlePasswordChange}
      placeholder="Confirm New Password"
      style={{ paddingRight: "40px" }}
    />
    <button
      type="button"
      className="eye-icon"
      onClick={() => setShowConfirm(prev => !prev)}
      tabIndex={-1}
    >
      {showConfirm ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
    </button>
  </div>

  <button
    className="save-button"
    onClick={handlePasswordSave}
    disabled={loading}
  >
    Save Password
  </button>
</>

              )}
            </div>
          </main>
        </div>
      );
    };

    export default Settings;
