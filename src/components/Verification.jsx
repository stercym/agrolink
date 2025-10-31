import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, XCircle, LogIn, UserPlus } from "lucide-react";
import "./Verification.css";

const Verification = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get("status");
  const isSuccess = status === "success";

  return (
    <main className="verification-container">
      <div className={`verification-card ${isSuccess ? "success" : "error"}`}>
        <div className="verification-icon" aria-hidden="true">
          {isSuccess ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>
        <h1>{isSuccess ? "Email verified successfully" : "Verification link expired"}</h1>
        <p>
          {isSuccess
            ? "Great news! Your email is confirmed. You can now sign in to access your account."
            : "The verification link may have expired or already been used. You can request a new link by registering again."}
        </p>

        {isSuccess ? (
          <Link to="/login" className="verification-action">
            <LogIn size={18} aria-hidden="true" />
            Back to login
          </Link>
        ) : (
          <Link to="/register" className="verification-action">
            <UserPlus size={18} aria-hidden="true" />
            Create a new account
          </Link>
        )}
      </div>
    </main>
  );
};

export default Verification;