
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Zakarie’s components
import Navbar from "./components/Navbar";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Home from "./components/Home";
import NavBar from "./components/NavBar";
import About from "./components/About";
import Working from "./components/Working";

import CartPageContainer from "./pages/CartPageContainer";
import CheckoutPageContainer from "./pages/CheckoutPageContainer";
import OrderPageContainer from "./pages/OrderPageContainer";
import ChatPageContainer from "./pages/ChatPageContainer";


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

import DeliveryDashboardAgent from "./components/DeliveryDashboardAgent";
import DeliveryTrackingBuyer from "./components/DeliveryTrackingBuyer";
import DeliveryGroupSummary from "./components/DeliveryGroupSummary";

import "./App.css";

function AgentDashboardWrapper() {
  const { id } = useParams();
  return <DeliveryDashboardAgent agentId={id} />;
}

function TrackingWrapper() {
  const { orderId } = useParams();
  return <DeliveryTrackingBuyer orderId={orderId} />;
}



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
      <NavBar />

      <div className="app-root">
        <Routes>

          {/* 🏠 Public pages */}

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<Working />} />
          <Route path="/cart" element={<Navigate to="/cart" replace />} />
          <Route path="/carts" element={<CartPageContainer />} />
          <Route path="/checkout" element={<CheckoutPageContainer />} />
          <Route path="/orders" element={<OrderPageContainer />} />
          <Route path="/chat" element={<ChatPageContainer />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/agent/:id/dashboard" element={<AgentDashboardWrapper />} />
          <Route path="/track/:orderId" element={<TrackingWrapper />} />
          <Route path="/delivery-groups" element={<DeliveryGroupSummary />} />
          <Route path="/delivery/agent/:id" element={<AgentDashboardWrapper />} />
          <Route path="/delivery/track/:orderId" element={<TrackingWrapper />} />
          


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


export default App; 
