import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import "../styles/topbar.css";

// import the placeholder image
import placeholderImg from "../assets/placeholder.png";

const Topbar = ({ title = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileImg, setProfileImg] = useState(placeholderImg);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setProfileImg(parsedUser.profileImage || placeholderImg);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="topbar">
      <h1 className="topbar-title">{title}</h1>

      {location.pathname === "/settings" ? (
        <>


          {/* Modal */}
          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to logout?</p>
                <div className="modal-actions">
                  <button
                    className="modal-btn cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="modal-btn confirm" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Link to="/settings">
          <img
            src={profileImg}
            alt="avatar"
            className="avatar"
            onError={(e) => (e.currentTarget.src = placeholderImg)} // fallback if image fails
          />
        </Link>
      )}
    </div>
  );
};

export default Topbar;