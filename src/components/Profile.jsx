import React from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardsAndProfile.css";

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    navigate("/login");
    return null;
  }

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dash-container">
      <div className="dash-card">
        <h2>User Profile</h2>
        <div className="dash-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Location:</strong> {user.location}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
