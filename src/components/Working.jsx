import React from "react";
import "./Working.css";
import working from "../assets/working.png";

function Working() {
  
  return (
    <div className="working-page">
      <div className="working-inner">
        <h1 className="working-title">How Agrolink Works</h1>

        <div className="working-image">
          <img
            src={working}
            alt="How Agrolink Works image"
          />
        </div>

        <p className="working-caption">
          Follow the steps to see how farmers and buyers
          connect, order, pay and receive products on Agrolink.
        </p>
      </div>
    </div>
  );
}

export default Working;
