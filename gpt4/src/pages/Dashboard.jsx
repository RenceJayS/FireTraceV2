import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/sidebar";
import Header from "../components/topbar";
import "../styles/dashboard.css";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

// Map pins
import lowPin from "../assets/low-pin.png";
import midPin from "../assets/mid-pin.png";
import highPin from "../assets/high-pin.png";

// Stat card icons
import totalIcon from "../assets/total.png";
import lowIcon from "../assets/lowl.png";
import midIcon from "../assets/midl.png";
import highIcon from "../assets/highl.png";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 14.5458512,
  lng: 121.0018118,
};

const Dashboard = () => {
  const [houses, setHouses] = useState([]);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [userType, setUserType] = useState("user"); // 👈 Default to user

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    // ✅ Detect logged-in user type
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.type) {
      setUserType(savedUser.type);
    }

    const fetchHouses = async () => {
      try {
        const res = await axios.get("https://firetrace-backend.onrender.com/api/house-risk/all");
        const data = res.data;

        // Group by address & count risks
        const grouped = Object.values(
          data.reduce((acc, house) => {
            const address = (house.address || "Unknown").trim().toLowerCase();

            if (!acc[address]) {
              acc[address] = {
                ...house,
                count: { high: 0, moderate: 0, low: 0 },
                images: [], // ✅ store all images
              };
            }

            // Count risk levels
            const risk = house.riskLevel?.toLowerCase();
            if (risk && acc[address].count[risk] !== undefined) {
              acc[address].count[risk]++;
            }

            // Collect images
            if (house.imageUrl) {
              acc[address].images.push({
                url: house.imageUrl,
                createdAt: house.createdAt || new Date().toISOString(),
              });
            }

            return acc;
          }, {})
        ).map((group) => {
          // ✅ Determine majority risk
          const { high, moderate, low } = group.count;
          let finalRisk = "low";

          if (high >= moderate && high >= low) {
            finalRisk = "high";
          } else if (moderate >= high && moderate >= low) {
            finalRisk = "moderate";
          } else {
            finalRisk = "low";
          }

          // ✅ Get latest image
          let latestImage = null;
          if (group.images.length > 0) {
            group.images.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            latestImage = group.images[0].url;
          }

          return { ...group, finalRisk, latestImage };
        });

        // ✅ Geocode missing coordinates
        if (isLoaded) {
          const geocoder = new window.google.maps.Geocoder();

          for (let house of grouped) {
            if (!house.coordinates?.lat || !house.coordinates?.lng) {
              try {
                const result = await geocoder.geocode({ address: house.address });
                if (result.results[0]) {
                  const loc = result.results[0].geometry.location;
                  house.coordinates = { lat: loc.lat(), lng: loc.lng() };
                }
              } catch (geoErr) {
                console.error("Geocoding failed:", geoErr);
              }
            }
          }
        }

        setHouses(grouped);

        // ✅ Compute stats
        setStats({
          total: grouped.length,
          high: grouped.filter((h) => h.finalRisk === "high").length,
          medium: grouped.filter((h) => h.finalRisk === "moderate").length,
          low: grouped.filter((h) => h.finalRisk === "low").length,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching houses:", err);
        setLoading(false);
      }
    };

    fetchHouses();
    const intervalId = setInterval(fetchHouses, 10000);
    return () => clearInterval(intervalId);
  }, [isLoaded]);

  const statCards = [
    { title: "Total", value: stats.total, color: "orange", icon: totalIcon },
    { title: "High-Risk", value: stats.high, color: "red", icon: highIcon },
    { title: "Medium-Risk", value: stats.medium, color: "yellow", icon: midIcon },
    { title: "Low-Risk", value: stats.low, color: "green", icon: lowIcon },
  ];

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard">
        <main className="dashboard-main">
          {(loading || !isLoaded) ? (
            <div className="skeleton-wrapper">
              <div className="stats-grid">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="stat-card skeleton">
                    <div className="stat-header">
                      <div className="skeleton-icon"></div>
                      <div>
                        <div className="skeleton-title"></div>
                        <div className="skeleton-subtitle"></div>
                      </div>
                    </div>
                    <div className="skeleton-value"></div>
                  </div>
                ))}
              </div>

              <div className={userType === "admin" ? "main-content-admin" : "main-content-user"}>
                <div className={`map-container ${userType === "user" ? "map-container-user" : "map-container-admin"}`}>
                  <div className="skeleton-map"></div>
                </div>
                {userType === "admin" && (
                  <div className="table-container">
                    <h2 className="table-title">Recent Analysis Table</h2>
                    <div className="skeleton-table">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="skeleton-row"></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="stats-grid">
                {statCards.map((card, idx) => (
                  <div key={idx} className={`stat-card border-${card.color}`}>
                    <div className="stat-header">
                      <img
                        src={card.icon}
                        alt={`${card.title} Icon`}
                        className="stat-icon"
                        style={{ width: 40, height: 40, marginRight: 12 }}
                      />
                      <div>
                        <h4 className="stat-title">{card.title}</h4>
                        <p className="stat-subtitle">Houses Scanned</p>
                      </div>
                    </div>
                    <div className={`stat-value text-${card.color}`}>
                      {card.value || 0}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map + Table */}
              <div className={userType === "admin" ? "main-content-admin" : "main-content-user"}>
                <div className={`map-container ${userType === "user" ? "map-container-user" : "map-container-admin"}`}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={18}
                  >
                    {houses
                      .filter((h) => h.coordinates?.lat && h.coordinates?.lng)
                      .map((house) => {
                        const lat = Number(house.coordinates.lat);
                        const lng = Number(house.coordinates.lng);

                        let iconUrl = lowPin;
                        if (house.finalRisk === "high") iconUrl = highPin;
                        else if (house.finalRisk === "moderate") iconUrl = midPin;

                        return (
                          <Marker
                            key={house._id || house.address}
                            position={{ lat, lng }}
                            icon={{
                              url: iconUrl,
                              scaledSize: new window.google.maps.Size(40, 45),
                            }}
                            onClick={() => setSelected(house)}
                          />
                        );
                      })}

                    {selected && selected.coordinates?.lat && selected.coordinates?.lng && (
                      <InfoWindow
  position={{
    lat: Number(selected.coordinates.lat),
    lng: Number(selected.coordinates.lng),
  }}
  onCloseClick={() => setSelected(null)}
>
  <div className="infowindow-container">
    {/* ✅ Show latest image */}
    {selected.latestImage ? (
      <img
        src={selected.latestImage}
        alt="Latest scan"
        className="infowindow-image"
      />
    ) : (
      <p className="infowindow-empty">No image available</p>
    )}

    <span className="infowindow-address">
      {selected.address || "No address"}
    </span>

    <p className={`infowindow-risk ${selected.finalRisk?.toLowerCase()}`}>
      Risk Level: <span>{selected.finalRisk || "Unknown"}</span>
    </p>

    <p className="infowindow-stats">
      📊 High: {selected.count?.high || 0}, Moderate: {selected.count?.moderate || 0}, 
      Low: {selected.count?.low || 0}
    </p>
  </div>
</InfoWindow>

                    )}
                  </GoogleMap>
                </div>

                {/* ✅ Only admins see this table */}
                {userType === "admin" && (
                  <div className="table-container">
                    <h2 className="table-title">Recent Analysis Table</h2>
                    <ul className="table-list">
                      {houses.slice(0, 10).map((item) => {
                        const imageUrl = item.latestImage || "/placeholder.png";
                        return (
                          <li key={item._id || item.address} className="table-item">
                            <img
                              src={imageUrl}
                              alt={`House ${item.address || "Unknown"}`}
                              className="table-img"
                              onError={(e) => {
                                if (!e.target.src.includes("placeholder.png")) {
                                  e.target.src = "/placeholder.png";
                                }
                              }}
                            />
                            <span className="table-location">
                              {item.address || "No address"}
                            </span>
                            <span
                              className={`risk-indicator ${item.finalRisk?.toLowerCase() || ""}`}
                            ></span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
