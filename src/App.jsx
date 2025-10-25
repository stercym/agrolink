import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Zakarie’s components
import Navbar from "./components/Navbar";
import Registration from "./components/Registration";
import Login from "./components/Login";
import Verification from "./components/Verification";
import BuyerDashboard from "./components/BuyerDashboard";
import FarmerDashboard from "./components/FarmerDashboard";
import DeliveryDashboard from "./components/DeliveryDashboard";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import About from "./components/About";
import Working from "./components/Working";

// Your product-related components
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductDetails from "./components/ProductDetails";

import "./App.css";

function App() {
  const [refresh, setRefresh] = useState(false);
  const handleAdded = () => setRefresh(!refresh);

  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* 🏠 Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<Working />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verification" element={<Verification />} />

          {/* 🧑‍🌾 Farmer Product Management */}
          <Route path="/products" element={<ProductList key={refresh} />} />
          <Route
            path="/products/new"
            element={<ProductForm onAdded={handleAdded} />}
          />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* 🔒 Protected dashboards */}
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

export default App;

