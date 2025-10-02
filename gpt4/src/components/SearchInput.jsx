import React from "react";
import { FaSearch } from "react-icons/fa";
import "../styles/searchInput.css"; // optional for styling

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="search-container">
      <input
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <FaSearch className="search-icon" />
    </div>
  );
};

export default SearchInput;
