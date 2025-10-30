import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "../Config.jsx";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, User } from "lucide-react";
import "./Login.css";

// Validation schema
const schema = yup.object({
  email: yup.string().required("Email is required").email("Please enter a valid email"),
  password: yup.string().required("Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (data) => {
    setErrorMsg("");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", data);

      // Save JWT and user data in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.user?.role) {
        localStorage.setItem("role", res.data.user.role);
      }

      // Redirect by role
      const role = res.data.user.role;
      if (role === "buyer") navigate("/buyer-dashboard");
      else if (role === "farmer") navigate("/farmer-dashboard");
      else if (role === "delivery_agent") navigate("/delivery-dashboard");
      else if (role === "superadmin") navigate("/admin-dashboard");
      else navigate("/dashboard");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="login-heading">
          <div className="login-icon" aria-hidden="true">
            <LogIn size={32} />
          </div>
          <h1>Welcome back</h1>
        </div>

        {errorMsg && (
          <div className="status-banner error" role="alert">
            {errorMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <Mail size={16} />
              </span>
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your email address e.g you@gmail.com"
              autoComplete="email"
              className={`form-input ${errors.email ? "has-error" : ""}`}
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="helper-text" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`form-input ${errors.password ? "has-error" : ""}`}
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="helper-text" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button type="submit" className="primary-action" disabled={loading}>
            {loading ? (
              <>
                <span className="button-loader" aria-hidden="true" />
                Signing you in…
              </>
            ) : (
              <>
                <LogIn size={18} aria-hidden="true" />
                Sign in
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="login-footer-primary">
            <span>Need an account?</span>
            <button type="button" className="secondary-action" onClick={() => navigate("/register")}>
              <User size={16} aria-hidden="true" />
              Create one
            </button>
          </div>
          <button type="button" className="text-action" onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </button>
        </div>
      </div>
    </main>
  );
};

export default Login;