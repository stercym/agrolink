// src/components/Verification.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./Verification.css";

function Verification() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get("status");

  return (
    <div className="verification-container">
      {status === "success" ? (
        <div className="verification-card success">
          <h2>✅ Email Verified Successfully!</h2>
          <p>You can now log in to your account.</p>
          <Link to="/login" className="btn">Go to Login</Link>
        </div>
      ) : (
        <div className="verification-card error">
          <h2>❌ Verification Failed</h2>
          <p>The link might be invalid or expired.</p>
          <Link to="/register" className="btn">Go to Registration</Link>
        </div>
      )}
    </div>
  );
}

export default Verification;
