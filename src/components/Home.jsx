import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import handshake from "../assets/handshake.png";
import greenarrow from "../assets/greenarrow.png";
import userimage from "../assets/userimage.png";
import cart from "../assets/cart.png";
import lorry from "../assets/lorry.png";

function Home() {
  const navigate = useNavigate();

  // Handle navigation based on role
  const handleRedirect = (role) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please log in first to continue.");
      navigate("/login");
      return;
    }

    if (role === "Farmer" && user.role === "Farmer") {
      navigate("/farmer-dashboard");
    } else if (role === "Buyer" && user.role === "Buyer") {
      navigate("/buyer-dashboard");
    } else if (role === "Delivery" && user.role === "Delivery") {
      navigate("/delivery-dashboard");
    } else {
      alert(`Access denied. You are logged in as ${user.role}.`);
    }
  };

  return (
    <div className="home-container" id="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h2>
            From farm <span className="highlight">to table...</span>
          </h2>

          <div className="hero-buttons">
            <button
              className="btn-green"
              onClick={() => navigate("/register", { state: { role: "Farmer" } })}
            >
              Join as Farmer
            </button>
            <button
              className="btn-green"
              onClick={() => navigate("/register", { state: { role: "Buyer" } })}
            >
              Join as Buyer
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src={greenarrow} alt="arrow" className="arrow-img" />
          <img src={handshake} alt="handshake" className="handshake-img" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section" id="how">
        <h3>How it works</h3>

        <div className="how-grid">
          <div className="how-card" onClick={() => handleRedirect("Farmer")}>
            <img src={userimage} alt="Farmer" className="how-icon" />
            <p>Farmer Requirements</p>
          </div>

          <div className="how-card" onClick={() => handleRedirect("Buyer")}>
            <img src={cart} alt="Buyer Cart" className="how-icon" />
            <p>Buyer Dashboard</p>
          </div>

          <div className="how-card" onClick={() => handleRedirect("Delivery")}>
            <img src={lorry} alt="Delivery Truck" className="how-icon" />
            <p>Delivery Dashboard</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="footer">
        <p className="footer-text">
          © 2025 AgroLink. Connecting farmers and buyers seamlessly.
        </p>
      </div>
    </div>
  );
}

export default Home;
