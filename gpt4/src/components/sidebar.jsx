import {
  MdDashboard,
  MdFileUpload,
  MdHome,
  MdSettings,
  MdLogout,
  MdCampaign,   // 👈 Announcements
  MdFeedback    // 👈 New Feedback icon
} from "react-icons/md";
import React, { useState } from "react"; // ✅ Added useState
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✅ Modal state

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h1 className="logo">FireTrace</h1>
        <nav>
          <Link to="/dashboard" className={activePath === "/dashboard" ? "active" : ""}>
            <MdDashboard className="nav-icon" /> <span className="nav-text">Dashboard</span>
          </Link>

          <Link to="/upload" className={activePath === "/upload" ? "active" : ""}>
            <MdFileUpload className="nav-icon" /> <span className="nav-text">Upload Image</span>
          </Link>

          <Link to="/scanned-houses" className={activePath === "/scanned-houses" ? "active" : ""}>
            <MdHome className="nav-icon" /> <span className="nav-text">Scanned Houses</span>
          </Link>

          {/* ✅ Announcements Tab */}
          <Link to="/announcements" className={activePath === "/announcements" ? "active" : ""}>
            <MdCampaign className="nav-icon" /> <span className="nav-text">Announcements</span>
          </Link>

          {/* ✅ New Feedback Tab */}
          <Link to="/feedback" className={activePath === "/feedback" ? "active" : ""}>
            <MdFeedback className="nav-icon" /> <span className="nav-text">Feedback</span>
          </Link>

          <Link to="/settings" className={activePath === "/settings" ? "active" : ""}>
            <MdSettings className="nav-icon" /> <span className="nav-text">Settings</span>
          </Link>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="logout" onClick={() => setShowLogoutModal(true)}>
          <MdLogout className="nav-icon" /> <span className="nav-text">Log out</span>
        </button>
      </div>

      {/* ✅ Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop1 show">
          <div className="modal-content1">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions1">
              <button className="modal-btn1" onClick={handleLogout}>Yes</button>
              <button className="modal-btn1" onClick={() => setShowLogoutModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
