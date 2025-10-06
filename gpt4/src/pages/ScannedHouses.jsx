import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/sidebar";
import SearchInput from "../components/SearchInput";
import "../styles/scannedHouses.css";
import { Trash2 } from "lucide-react";


import { MdGridView, MdTableRows } from "react-icons/md";

const RiskLevelTag = React.memo(({ level }) => {
  const labelMap = {
    high: "🔴 High Risk",
    medium: "🟡 Medium Risk",
    low: "🟢 Low Risk",
  };
  return <strong className="risk-tag">{labelMap[level] || "⚪ Unknown"}</strong>;
});

const SkeletonCard = () => (
  <div className="skeleton-card" aria-busy="true">
    <div className="skeleton-img"></div>
    <div className="skeleton-content">
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
  </div>
);

const ScannedHouses = () => {
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [filters, setFilters] = useState({
    level: "",
    street: "",
    sortDate: "latest",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [userType, setUserType] = useState("user");
  const [deleteTarget, setDeleteTarget] = useState(null); // store scan to delete
const [showDeleteModal, setShowDeleteModal] = useState(false);


  const fetchedOnce = useRef(false);
  const HOUSES_PER_PAGE = 20;
  
const handleDelete = async (scanId) => {
  try {
    const userId = localStorage.getItem("userId");
    const userType = localStorage.getItem("userType");

    await axios.delete(
      `https://firetrace-backend.onrender.com/api/house-risk/${scanId}?userId=${userId}&userType=${userType}`
    );

    // update state after successful delete
    setSelectedHouse(prev =>
      prev ? { ...prev, list: prev.list.filter(scan => scan._id !== scanId) } : prev
    );

    setHouses(prev =>
      prev.map(h =>
        h.address === selectedHouse?.address
          ? { ...h, group: h.group.filter(scan => scan._id !== scanId) }
          : h
      )
    );

    if (selectedScan && selectedScan._id === scanId) {
      setSelectedScan(null);
    }
  } catch (err) {
    console.error("❌ Failed to delete scan:", err);
  }
};

  // Fetch houses
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    (async () => {
      try {
        const res = await axios.get("https://firetrace-backend.onrender.com/api/house-risk/all");
        const storedUser = JSON.parse(localStorage.getItem("user"));
        let houseData = res.data;

        if (storedUser?.type !== "admin") {
          houseData = houseData.filter(h => h.uploadedBy?._id === storedUser?.id);
        } else {
          setUserType("admin");
          // Group by address for admin view
          const grouped = Object.values(
            houseData.reduce((acc, h) => {
              if (!acc[h.address]) acc[h.address] = { ...h, group: [] };
              acc[h.address].group.push(h);
              if (new Date(h.createdAt) > new Date(acc[h.address].createdAt)) {
                acc[h.address].createdAt = h.createdAt;
                acc[h.address].imageUrl = h.imageUrl;
                acc[h.address].riskLevel = h.riskLevel;
              }
              return acc;
            }, {})
          );
          houseData = grouped;
        }

        houseData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHouses(houseData);
        setFilteredHouses(houseData);
      } catch (err) {
        console.error("❌ Failed to fetch houses:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter houses
  useEffect(() => {
    let updated = [...houses];
    if (filters.level) updated = updated.filter(h => h.riskLevel?.toLowerCase() === filters.level);
    if (filters.search)
      updated = updated.filter(h => h.address?.toLowerCase().includes(filters.search.toLowerCase()));
    updated.sort((a, b) =>
      filters.sortDate === "latest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );
    setFilteredHouses(updated);
    setCurrentPage(1);
  }, [filters, houses]);

  const totalPages = Math.ceil(filteredHouses.length / HOUSES_PER_PAGE);
  const currentHouses = filteredHouses.slice(
    (currentPage - 1) * HOUSES_PER_PAGE,
    currentPage * HOUSES_PER_PAGE
  );

  const handleSelectHouse = (house) => {
    if (userType === "admin") setSelectedHouse({ address: house.address, list: house.group || [] });
    else setSelectedHouse(house);
  };

  const renderHouseTable = () => (
    <table className="house-table">
      <thead>
        <tr>
          <th>Preview</th>
          <th>Address</th>
          {userType !== "admin" && <th>Uploaded By</th>}
          {userType !== "admin" && <th>Risk Level</th>}
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {currentHouses.map((house, idx) => {
          const created = new Date(house.createdAt);
          return (
            <tr key={idx} onClick={() => handleSelectHouse(house)} className="clickable-row">
              <td><img src={house.imageUrl || "/placeholder.png"} alt="preview" className="table-img" /></td>
              <td>{house.address}</td>
              {userType !== "admin" && <td>{house.uploadedBy?.name || "Unknown"}</td>}
              {userType !== "admin" && <td><RiskLevelTag level={house.riskLevel?.toLowerCase()} /></td>}
              <td>{created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

return (
  <div className="scanned-container">
    <Sidebar activePage="Scanned Houses" />
    <main className="scanned-main">
      <section className="house-section">
        <div className="section-header">
          <h2></h2>
          <div className="controls">
            <SearchInput
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search address..."
            />
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
                <MdGridView size={20} />
              </button>
              <button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")}>
                <MdTableRows size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="house-grid">{Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}</div>
        ) : currentHouses.length > 0 ? (
          viewMode === "grid" ? (
            <div className="house-grid">
              {currentHouses.map((house, idx) => (
                <article key={idx} className="house-card" onClick={() => handleSelectHouse(house)}>
                  <div className="image-wrapper">
                    <img src={house.imageUrl || "/placeholder.png"} alt="house" />
                  </div>
                  <div className="info-wrapper">
                    <p><strong>Address:</strong> {house.address}</p>
                    {userType !== "admin" && (
                      <>
                        <p><strong>Uploaded By:</strong> {house.uploadedBy?.name || "Unknown"}</p>
                        <p><strong>Risk:</strong> <RiskLevelTag level={house.riskLevel?.toLowerCase()} /></p>
                      </>
                    )}
                    <p><strong>Last Update:</strong> {new Date(house.createdAt).toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            renderHouseTable()
          )
        ) : (
          <p style={{ padding: "20px", textAlign: "center", color: "#666", fontStyle: "italic" }}>
            No houses found.
          </p>
        )}
      </section>
    </main>

    {/* Selected house modal */}
    {selectedHouse && (
      <aside className="modal-overlay" onClick={() => setSelectedHouse(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedHouse(null)}>&times;</button>
          {userType === "admin" && selectedHouse.list ? (
            <>
              <h3>All Scans for {selectedHouse.address}</h3>
              <table className="house-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Uploaded By</th>
                    <th>Risk Level</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHouse.list.map((h, i) => {
                    const created = new Date(h.createdAt);
                    return (
                      <tr key={i} onClick={() => setSelectedScan(h)}>
                        <td><img src={h.imageUrl || "/placeholder.png"} className="table-img" /></td>
                        <td>{h.uploadedBy?.name || "Unknown"}</td>
                        <td><RiskLevelTag level={h.riskLevel?.toLowerCase()} /></td>
                        <td>{created.toLocaleDateString()}</td>
                        <td>{created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(h._id);
                              setShowDeleteModal(true);
                            }}
                            className="delete-btn"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div className="modal-image-wrapper">
                <img src={selectedHouse.imageUrl || "/placeholder.png"} alt="House" />
              </div>
              <div className="modal-details">
                <h3>House Details</h3>
                <p><strong>Address:</strong> {selectedHouse.address}</p>
                <p><strong>Uploaded By:</strong> {selectedHouse.uploadedBy?.name || "Unknown"}</p>
                <p><strong>Date:</strong> {new Date(selectedHouse.createdAt).toLocaleString()}</p>
                <p><strong>Risk Level:</strong> <RiskLevelTag level={selectedHouse.riskLevel?.toLowerCase()} /></p>
                <p><strong>GPT Result:</strong> {selectedHouse.gptResult || "No result available"}</p>
              </div>
            </>
          )}
        </div>
      </aside>
    )}

    {/* Selected scan modal */}
    {selectedScan && (
      <aside className="modal-overlay" onClick={() => setSelectedScan(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedScan(null)}>&times;</button>
          <div className="modal-image-wrapper">
            <img src={selectedScan.imageUrl || "/placeholder.png"} alt="House" />
          </div>
          <div className="modal-details">
            <h3>Scan Details</h3>
            <p><strong>Uploaded By:</strong> {selectedScan.uploadedBy?.name || "Unknown"}</p>
            <p><strong>Risk Level:</strong> <RiskLevelTag level={selectedScan.riskLevel?.toLowerCase()} /></p>
            <p><strong>Date Uploaded:</strong> {new Date(selectedScan.createdAt).toLocaleString()}</p>
            <div>
              <strong>Result & Recommendations:</strong>
              {selectedScan.gptResult ? (
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {selectedScan.gptResult
                    .split("\n")
                    .filter(line => line.trim() !== "")
                    .map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                </ul>
              ) : (
                <p>No result available</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    )}

    {/* ✅ Delete Confirmation Modal */}
    {showDeleteModal && (
      <aside className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>Are you sure you want to delete this scan?</h3>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget);
                  setShowDeleteModal(false);
                  window.location.reload(); // ✅ refresh after delete
                }
              }}
              style={{ background: "#dc3545", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "5px" }}
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{ background: "#6c757d", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "5px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    )}
  </div>
);

};

export default ScannedHouses;
