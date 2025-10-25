import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Registration from "./components/Registration";
import Login from "./components/Login";
import Verification from "./components/Verification";
import BuyerDashboard from "./components/BuyerDashboard";
import FarmerDashboard from "./components/FarmerDashboard";
import DeliveryDashboard from "./components/DeliveryDashboard";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verification" element={<Verification />} />

          {/* Protected routes */}
          <Route
            path="/buyer-dashboard"
            element={
              <ProtectedRoute>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard"
            element={
              <ProtectedRoute>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

// Small landing placeholder
function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to AgroLink</h1>
      <p>Empowering farmers, buyers, and delivery partners together!</p>
    </div>
  );
}

export default App;
