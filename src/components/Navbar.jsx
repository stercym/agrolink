import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2 className="logo">AgroLink</h2>

      <div className="nav-links">
        {!token ? (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        ) : (
          <>
            {role === "buyer" && <Link to="/buyer-dashboard">Dashboard</Link>}
            {role === "farmer" && <Link to="/farmer-dashboard">Dashboard</Link>}
            {role === "delivery" && (
              <Link to="/delivery-dashboard">Dashboard</Link>
            )}
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
