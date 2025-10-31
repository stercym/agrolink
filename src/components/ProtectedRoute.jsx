import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../Config.jsx";

const persistUser = (user, token) => {
  if (!user) {
    return;
  }

  try {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.role) {
      localStorage.setItem("role", user.role);
    }
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Failed to persist user", error);
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  delete api.defaults.headers.common.Authorization;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [state, setState] = useState({
    checking: true,
    authorized: false,
    user: null,
    reason: "unauthenticated",
  });

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    if (!token) {
      setState({ checking: false, authorized: false, user: null, reason: "missing-token" });
      return () => {
        isMounted = false;
      };
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    const controller = new AbortController();

    const verify = async () => {
      try {
        const response = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        const user = response.data?.user;
        persistUser(user, token);

        const roleAllowed = Array.isArray(allowedRoles)
          ? allowedRoles.includes(user?.role)
          : true;

        setState({
          checking: false,
          authorized: Boolean(user) && roleAllowed,
          user,
          reason: roleAllowed ? "ok" : "forbidden",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearAuthStorage();

        const status = error?.response?.status;
        setState({
          checking: false,
          authorized: false,
          user: null,
          reason: status === 403 ? "forbidden" : "expired",
        });
      }
    };

    verify();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [allowedRoles, location.key]);

  if (state.checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Validating your session...</p>
        </div>
      </div>
    );
  }

  if (!state.authorized) {
    const destination = state.reason === "forbidden" ? "/" : "/login";
    return (
      <Navigate
        to={destination}
        replace
        state={{ from: location.pathname, reason: state.reason }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;