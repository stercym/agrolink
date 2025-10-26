import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CartPageContainer from "./pages/CartPageContainer";
import CheckoutPageContainer from "./pages/CheckoutPageContainer";

import OrderPageContainer from "./pages/OrderPageContainer";
import ChatPageContainer from "./pages/ChatPageContainer";
import "./App.css";

export default function App(){
  return (
    <Router>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Navigate to="/cart" replace />} />
          <Route path="/cart" element={<CartPageContainer />} />
          <Route path="/checkout" element={<CheckoutPageContainer />} />
          
          <Route path="/orders" element={<OrderPageContainer />} />
          <Route path="/chat" element={<ChatPageContainer />} />
          <Route path="*" element={<div style={{padding:40}}>404 — Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}