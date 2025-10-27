// src/components/Login.jsx
import React, { useState } from "react";
import "./Login.css";
// import { api } from "/home/zakarie/agrolink/Config.jsx";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.email || !formData.password) {
      setErrorMsg("All fields are required!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/login", formData);

      // Save JWT and user data in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));

      alert(res.data.message);

      // Redirect by role
      if (res.data.role === "Buyer") navigate("/buyer-dashboard");
      else if (res.data.role === "Farmer") navigate("/farmer-dashboard");
      else if (res.data.role === "Delivery") navigate("/delivery-dashboard");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">
          <span className="brand">Agro</span>link
        </h2>
        <h3>Login</h3>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="signup-link">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
