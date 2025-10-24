import React from "react";
import "./Home.css";
import handshake from "../assets/handshake.png";
import greenarrow from "../assets/greenarrow.png";
import userimage from "../assets/userimage.png";
import cart from "../assets/cart.png";
import lorry from "../assets/lorry.png";

function Home() {
  return (
    <div className="home-container" id="home">
      
      <section className="hero-section">
        <div className="hero-text">
          <h2>
            From farm <span className="highlight">to table...</span>
          </h2>
          <div className="hero-buttons">
            <a href="/register-farmer" className="btn-green">Join as Farmer</a>
            <a href="/register-buyer" className="btn-green">Join as Buyer</a>
          </div>
        </div>

        <div className="hero-image">
          <img src={greenarrow} alt="arrow" className="arrow-img" />
          <img src={handshake} alt="handshake" className="handshake-img" />
        </div>
      </section>

      <section className="how-section" id="how">
        <h3>How it works</h3>

        <div className="how-grid">
          <div className="how-card">
            <img src={userimage} alt="Farmer" className="how-icon" />
            <p>
              Farmer Requirements
            </p>
          </div>

          <div className="how-card">
            <img src={cart} alt="Buyer Cart" className="how-icon" />
            <p>
              Buyer Requirements
            </p>
          </div>

          <div className="how-card">
            <img src={lorry} alt="Delivery Truck" className="how-icon" />
            <p>
              Delivery Requirements
            </p>
          </div>
        </div>
      </section>
      
      <div className="footer">

      <p className="footer-text">© 2025 AgroLink. Connecting farmers and buyers seamlessly.</p>
      </div>

    </div>
  );
}

export default Home;
