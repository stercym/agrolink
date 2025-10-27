import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/logo.png";


function NavBar() {
  const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
  
    const handleLogout = () => {
      localStorage.clear();
      navigate("/login");
    };
  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="Agrolink Logo" className="logo-img" />
      </div>

      <ul className="nav-links">
        <li><Link to="/" className="nav-item">Home</Link></li>
        <li><Link to="/about" className="nav-item">About</Link></li>
        <li><Link to="/how-it-works" className="nav-item">How It Works</Link></li>
        
      </ul>

      <Link to="/signin" className="signin-btn">Sign In</Link>
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

export default NavBar;
