// src/components/Registration.jsx
import React, { useState } from "react";
import "./Registration.css";
import { api } from "/home/zakarie/agrolink/Config.jsx";
import { useNavigate } from "react-router-dom";

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Farmer",
    phone: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Ensure all fields are filled
    for (let key in formData) {
      if (!formData[key]) {
        setErrorMsg("All fields are required!");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.post("/register", formData);
      alert(res.data.message);
      navigate("/login");
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2 className="register-title">
          <span className="brand">Agro</span>link
        </h2>
        <h3>Registration</h3>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <label>Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
        />

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

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="Farmer">Farmer</option>
          <option value="Buyer">Buyer</option>
          <option value="Delivery">Delivery</option>
        </select>

        <label>Phone</label>
        <input
          type="text"
          name="phone"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleChange}
        />

        <label>Location</label>
        <input
          type="text"
          name="location"
          placeholder="Enter your location"
          value={formData.location}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Registration;
