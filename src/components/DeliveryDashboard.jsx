import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../Config";
import "./DashboardsAndProfile.css";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error(error);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dash-container">
      <div className="dash-card">
        <h2>Welcome, Delivery!</h2>
        {user ? (
          <div className="dash-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Location:</strong> {user.location}</p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default DeliveryDashboard;

