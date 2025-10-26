import React from "react";
import { Link } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/logo.png";


function NavBar() {
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
    </nav>
  );
}

export default NavBar;
