import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import Dashboard from "./pages/Dashboard";
import ImageUploader from "./pages/ImageUploader";
import ScannedHouses from "./pages/ScannedHouses";
import DoubleSlider from "./pages/DoubleSlider";
import Settings from "./pages/Settings";
import Announcements from "./pages/AdminAnnouncements"; // ✅ Announcements page
import Feedback from "./pages/Feedback"; // ✅ Import Feedback page

// Simple mock authentication check (replace with your real auth logic)
const isAuthenticated = () => {
  return Boolean(localStorage.getItem("user"));
};

// Wrapper component to protect routes
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    // Redirect to login (DoubleSlider) if not authenticated
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();

  // Consider any route starting with "/" or "/auth" as an auth page
  const isAuthPage =
    location.pathname === "/" || location.pathname.startsWith("/auth");

  // Define titles per route
  const routeTitles = {
    "/dashboard": "Dashboard",
    "/upload": "Upload Image",
    "/scanned-houses": "Scanned Houses",
    "/announcements": "Announcements",
    "/feedback": "Feedback", // ✅ Added Feedback title
    "/settings": "Settings",
  };

  const currentTitle = routeTitles[location.pathname] || "";

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh" }}>
      {!isAuthPage && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!isAuthPage && <Topbar title={currentTitle} />}
        <main style={{ flex: 1}}>
          <Routes>
            {/* Default Route - Always show DoubleSlider on "/" */}
            <Route path="/" element={<DoubleSlider />} />

            {/* Optional /auth route */}
            <Route path="/auth" element={<DoubleSlider />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <ImageUploader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanned-houses"
              element={
                <ProtectedRoute>
                  <ScannedHouses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback" // ✅ New Feedback route
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
