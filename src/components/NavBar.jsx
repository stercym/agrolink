import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/logo.png";
import { api } from "../Config.jsx";

const resolveDashboardPath = (role) => {
  if (role === "buyer") {
    return "/buyer-dashboard";
  }
  if (role === "farmer") {
    return "/farmer-dashboard";
  }
  if (role === "delivery_agent" || role === "delivery") {
    return "/delivery-dashboard";
  }
  if (role === "superadmin") {
    return "/admin-dashboard";
  }
  return "/";
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  delete api.defaults.headers?.common?.Authorization;
};

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authSnapshot, setAuthSnapshot] = useState(() => ({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
  }));

  useEffect(() => {
    setAuthSnapshot({
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role"),
    });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (["token", "role", "user", "authToken"].includes(event.key)) {
        setAuthSnapshot({
          token: localStorage.getItem("token"),
          role: localStorage.getItem("role"),
        });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { token, role } = authSnapshot;
  const dashboardPath = resolveDashboardPath(role);

  const handleLogout = () => {
    clearSession();
    setAuthSnapshot({ token: null, role: null });
    navigate("/login", { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" onClick={closeMenu} aria-label="AgroLink home">
          <img src={logo} alt="AgroLink Logo" className="logo-img" />
        </Link>
      </div>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        type="button"
      >
        ☰
      </button>

      <div className={`nav-links-wrapper ${menuOpen ? "show" : ""}`}>
        <ul className="nav-links">
          <li>
            <Link to="/" className="nav-item" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className="nav-item" onClick={closeMenu}>
              About
            </Link>
          </li>
          <li>
            <Link to="/how-it-works" className="nav-item" onClick={closeMenu}>
              How It Works
            </Link>
          </li>
          {token && (
            <>
              <li>
                <Link to="/products" className="nav-item" onClick={closeMenu}>
                  Products
                </Link>
              </li>
              </>
          )}
              <li>
                <Link to="/carts" className="nav-item" onClick={closeMenu}>
                  Cart
                </Link>
              </li>
            
        </ul>

        <div className="nav-auth">
          {!token ? (
            <>
              <Link to="/register" className="nav-item" onClick={closeMenu}>
                Register
              </Link>
              <Link to="/login" className="signin-btn" onClick={closeMenu}>
                Login
              </Link>
            </>
          ) : (
            <>
              {role && role !== "" && (
                <Link to={dashboardPath} className="nav-item" onClick={closeMenu}>
                  Dashboard
                </Link>
              )}
              <Link to="/profile" className="nav-item" onClick={closeMenu}>
                Profile
              </Link>
              <button type="button" onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;