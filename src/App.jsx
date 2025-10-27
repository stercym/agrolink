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


function App() {
  return (
    <Router>
      <NavBar />

      <div className="app-root">
        <Routes>
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
export default App; 