import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/logo.png";

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="Agrolink Logo" className="logo-img" />
      </div>

      {/* Mobile toggle button */}
      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      {/* Links wrapper that collapses on mobile */}
      <div className={`nav-links-wrapper ${menuOpen ? "show" : ""}`}>
        <ul className="nav-links">
          <li><Link to="/" className="nav-item">Home</Link></li>
          <li><Link to="/about" className="nav-item">About</Link></li>
          <li><Link to="/how-it-works" className="nav-item">How It Works</Link></li>
          <li><Link to="/products" className="nav-item">Products</Link></li>
          <li><Link to="/carts" className="nav-item">Cart</Link></li>
        </ul>

        <div className="nav-auth">
          {!token ? (
            <>
              {/* <Link to="/register" className="nav-item">Register</Link> */}
              <Link to="/login" className="signin-btn">Login</Link>
            </>
          ) : (
            <>
              {role === "buyer" && <Link to="/buyer-dashboard" className="nav-item">Dashboard</Link>}
              {role === "farmer" && <Link to="/farmer-dashboard" className="nav-item">Dashboard</Link>}
              {role === "delivery" && <Link to="/delivery-dashboard" className="nav-item">Dashboard</Link>}
              <Link to="/profile" className="nav-item">Profile</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
