import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";

// Components
import NavBar from "./components/NavBar";
import Home from "./components/Home";
import About from "./components/About";
import Working from "./components/Working";
import Registration from "./components/Registration";
import Login from "./components/Login";
import Verification from "./components/Verification";
import BuyerDashboard from "./components/BuyerDashboard";
import FarmerDashboard from "./components/FarmerDashboard";
import DeliveryDashboard from "./components/DeliveryDashboard";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import DeliveryTrackingBuyer from "./components/DeliveryTrackingBuyer";
import DeliveryGroupSummary from "./components/DeliveryGroupSummary";

// Pages
import CartPageContainer from "./pages/CartPageContainer";
import CheckoutPageContainer from "./pages/CheckoutPageContainer";
import OrderPageContainer from "./pages/OrderPageContainer";
import ChatPageContainer from "./pages/ChatPageContainer";

// chat widget
import ChatWidget from "./components/chat/ChatWidget";

// Product management
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductDetails from "./components/ProductDetails";

import "./App.css";

// Wrapper components for route params
function AgentDashboardWrapper() {
  const { id } = useParams();
  return <DeliveryDashboard agentId={id} />;
}

function TrackingWrapper() {
  const { orderId } = useParams();
  return <DeliveryTrackingBuyer orderId={orderId} />;
}

function App() {
  const [refresh, setRefresh] = useState(false);
  const handleAdded = () => setRefresh(!refresh);

  return (
    <Router>
      <NavBar />
      <div className="app-root">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<Working />} />

          {/* E-commerce Pages */}
          <Route path="/carts" element={<CartPageContainer />} />
          <Route path="/checkout" element={<CheckoutPageContainer />} />
          <Route path="/orders" element={<OrderPageContainer />} />
          <Route path="/chat" element={<ChatPageContainer />} />

          {/* Auth Pages */}
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verification" element={<Verification />} />

          {/* Delivery Routes */}
          <Route path="/agent/:id/dashboard" element={<AgentDashboardWrapper />} />
          <Route path="/track/:orderId" element={<TrackingWrapper />} />
          <Route path="/delivery-groups" element={<DeliveryGroupSummary />} />

          {/* Product Management */}
          <Route path="/products" element={<ProductList key={refresh} />} />
          <Route path="/products/new" element={<ProductForm onAdded={handleAdded} />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Protected Dashboards */}
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

          
          <Route path="/cart" element={<Navigate to="/carts" replace />} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
}

export default App;

