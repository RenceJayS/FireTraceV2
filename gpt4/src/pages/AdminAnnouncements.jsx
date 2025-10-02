import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaThumbsUp, FaEdit, FaTrash } from "react-icons/fa";
import SearchInput from "../components/SearchInput";
import "../styles/announcements.css";

const API = "https://firetrace-backend.onrender.com/api/news"; // ✅ single base URL

const AdminAnnouncements = () => {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [animatingLike, setAnimatingLike] = useState(null);

  const [showLikers, setShowLikers] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const totalPages = news.length > 1 ? Math.ceil((news.length - 1) / pageSize) : 0;
  const startIndex = 1 + (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedNews = news.slice(startIndex, endIndex);

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.error("Invalid user object in localStorage.");
      }
    }
  }, []);

  // Load news
  useEffect(() => {
    fetchNews();
  }, [user]);

  const fetchNews = async () => {
    try {
      const res = await axios.get(API);
      setNews(res.data);
      setFilteredNews(res.data);

      if (user?._id || user?.id) {
        const currentUserId = user._id || user.id;
        const liked = res.data
          .filter((post) => post.likes?.includes(currentUserId))
          .map((p) => p._id);
        setLikedPosts(liked);
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    formData.append("folder", "announcements");
    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dlmrcsaqf/image/upload",
        formData
      );
      return res.data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return "";
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
    setPreview("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = preview;
      if (image) imageUrl = await uploadToCloudinary(image);

      const postData = { title, content, imageUrl };

      if (editingId) {
        await axios.put(`${API}/${editingId}`, postData);
      } else {
        await axios.post(API, postData);
      }

      fetchNews();
      resetForm();
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error saving news:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingId(post._id);
    setTitle(post.title);
    setContent(post.content);
    setPreview(post.imageUrl || "");
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchNews();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const toggleLike = async (postId) => {
    if (!user) return alert("You must be logged in to like posts.");
    const currentUserId = user._id || user.id;
    if (!currentUserId) return alert("Missing user ID. Please log in again.");

    setAnimatingLike(postId);
    try {
      const res = await axios.put(`${API}/${postId}/like`, { userId: currentUserId });

      setNews((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: res.data.liked
                  ? [...post.likes, currentUserId]
                  : post.likes.filter((id) => id !== currentUserId),
              }
            : post
        )
      );

      setLikedPosts((prev) =>
        res.data.liked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setTimeout(() => setAnimatingLike(null), 400);
    }
  };

  const viewLikers = async (postId) => {
    try {
      const res = await axios.get(`${API}/${postId}/likers`);
      setLikersList(res.data);
      setShowLikers(true);
    } catch (err) {
      console.error("Error fetching likers:", err);
    }
  };

  const LikeButton = ({ post }) => {
    const isLiked = likedPosts.includes(post._id);

    return (
      <button
        className={`like-button ${isLiked ? "liked" : ""} ${
          animatingLike === post._id ? "pop" : ""
        }`}
        onClick={() =>
          user?.type === "admin" ? viewLikers(post._id) : toggleLike(post._id)
        }
      >
        <FaThumbsUp /> {post.likes?.length || 0}
      </button>
    );
  };

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = news.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term)
    );
    setFilteredNews(filtered);
  };

  return (
    <div className="announcements-page">
      {/* Search Bar + Create Button */}
      {user?.type === "admin" && (
        <div className="search-create-row">
          <SearchInput
            value={""}
            onChange={handleSearchChange}
            placeholder="Search..."
          />
          <button onClick={openCreateModal} className="create-post-btn">
            + Create a Post
          </button>
        </div>
      )}

      {/* ✅ User Announcements Layout */}
      {user?.type === "user" && (
        <div className="announcements-layout">
          {news.length > 0 ? (
            <div className="main-announcement">
              <div className="announcement-card">
                <h3>{news[0].title}</h3>
                <p className="content">{news[0].content}</p>
                {news[0].imageUrl && (
                  <img
                    src={news[0].imageUrl}
                    alt={news[0].title}
                    className="main-img"
                  />
                )}
                <div className="announcement-footer">
                  <LikeButton post={news[0]} />
                  <span className="date">
                    {new Date(news[0].createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-announcement">
              <p style={{ padding: "20px", textAlign: "left", color: "#666", fontStyle: "italic" }}>
                No announcements yet.
              </p>
            </div>
          )}

          {/* ✅ Recent Announcements */}
          {paginatedNews.length > 0 && (
            <div className="recent-announcements">
              <h4>Recent Announcements</h4>
              {paginatedNews.map((item) => (
                <div key={item._id} className="recent-card">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="recent-img" />
                  )}
                  <div style={{ flex: 1 }}>
                    <p className="recent-title">{item.title}</p>
                    <span className="recent-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <LikeButton post={item} />
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Likers Modal */}
      {showLikers && (
        <div className="modal" onClick={() => setShowLikers(false)}>
          <div className="modal-content-liker" onClick={(e) => e.stopPropagation()}>
            <h3>
              <FaThumbsUp /> {likersList.length}{" "}
              {likersList.length === 1 ? "Like" : "Likes"}
            </h3>
            {likersList.length > 0 ? (
              <ul>
                {likersList.map((liker) => (
                  <li key={liker._id || liker.id}>
                    {liker.name || liker.email || "Unknown User"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No likes yet.</p>
            )}
            <button className="modal-close" onClick={() => setShowLikers(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      {showCreateModal && (
        <div className="modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-ps" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit Post" : "Create Post"}</h2>
            <form className="create-post-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="3"
                required
              />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {preview && (
                <div className="preview-container">
                  <p>Image Preview:</p>
                  <img src={preview} alt="Preview" className="preview-img" />
                </div>
              )}
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Post"}
              </button>
            </form>
            <button
              className="modal-close"
              onClick={() => setShowCreateModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admin Table */}
      {user?.type === "admin" && filteredNews.length > 0 && (
        <div className="admin-table-container">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Image</th>
                <th>Likes</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map((post) => (
                <tr key={post._id}>
                  <td>{post.title}</td>
                  <td>{post.content}</td>
                  <td>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.title} className="table-img" />
                    )}
                  </td>
                  <td><LikeButton post={post} /></td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(post)}
                      className="action-btn edit-btn"
                      title="Edit Post"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="action-btn delete-btn"
                      title="Delete Post"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
