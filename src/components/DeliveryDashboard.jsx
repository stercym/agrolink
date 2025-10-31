import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../Config.jsx";
import { useToast } from "./common/ToastProvider.jsx";
import "./DeliveryDashboard.css";

const STATUS_LABELS = {
  processing: "Processing",
  assigned: "Assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const ACTIVE_STATUSES = new Set(["assigned", "out_for_delivery"]);

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const TRANSITIONS = {
  assigned: { next: "out_for_delivery", label: "Start delivery" },
  out_for_delivery: { next: "delivered", label: "Mark delivered" },
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getStatusPillClass(status) {
  switch (status) {
    case "delivered":
      return "status-pill success";
    case "out_for_delivery":
      return "status-pill info";
    case "assigned":
      return "status-pill warning";
    case "cancelled":
    case "returned":
      return "status-pill danger";
    default:
      return "status-pill muted";
  }
}

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) {
      navigate("/login", { replace: true });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get("/auth/profile", { headers }),
        api.get("/api/delivery-agents/me/orders", { headers }),
      ]);

      setProfile(profileRes.data?.user || null);
      setOrders(ordersRes.data?.orders || []);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to load delivery dashboard", err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        pushToast({ type: "error", title: "Session expired", message: "Sign in again to continue." });
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
      const message =
        err.response?.data?.error || "We couldn’t load your delivery orders. Please try again.";
      setError(message);
      pushToast({ type: "error", title: "Dashboard error", message });
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, navigate, pushToast]);

  const refreshOrders = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) return;

    setIsRefreshing(true);
    try {
  const res = await api.get("/api/delivery-agents/me/orders", { headers });
      setOrders(res.data?.orders || []);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to refresh orders", err);
      const message = err.response?.data?.error || "Couldn’t refresh orders right now.";
      pushToast({ type: "error", title: "Refresh failed", message });
    } finally {
      setIsRefreshing(false);
    }
  }, [authHeaders, pushToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = useMemo(() => {
    if (!orders.length) {
      return { total: 0, active: 0, delivered: 0, pending: 0, earnings: 0 };
    }

    const delivered = orders.filter((order) => order.delivery_status === "delivered");
    const active = orders.filter((order) => ACTIVE_STATUSES.has(order.delivery_status));
    const pending = orders.filter(
      (order) => !ACTIVE_STATUSES.has(order.delivery_status) && order.delivery_status !== "delivered"
    );
    const earnings = delivered.reduce(
      (sum, order) => sum + Number(order.delivery_cost || 0),
      0
    );

    return {
      total: orders.length,
      active: active.length,
      delivered: delivered.length,
      pending: pending.length,
      earnings,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    switch (statusFilter) {
      case "active":
        return orders.filter((order) => ACTIVE_STATUSES.has(order.delivery_status));
      case "delivered":
        return orders.filter((order) => order.delivery_status === "delivered");
      case "cancelled":
        return orders.filter((order) => ["cancelled", "returned"].includes(order.delivery_status));
      default:
        return orders;
    }
  }, [orders, statusFilter]);

  const handleStatusUpdate = useCallback(
    async (orderId, currentStatus) => {
      const transition = TRANSITIONS[currentStatus];
      if (!transition) return;

      const headers = authHeaders();
      if (!headers) return;

      setUpdatingId(orderId);
      try {
        const response = await api.patch(
          `/api/orders/${orderId}/status`,
          { delivery_status: transition.next },
          { headers }
        );

        const updatedOrder = response.data?.order;
        if (updatedOrder) {
          setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
        }

        pushToast({ type: "success", title: "Status updated", message: transition.label });
      } catch (err) {
        console.error("Failed to update order status", err);
        const message = err.response?.data?.error || "Could not update the delivery status.";
        pushToast({ type: "error", title: "Update failed", message });
      } finally {
        setUpdatingId(null);
      }
    },
    [authHeaders, pushToast]
  );

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  const lastUpdatedLabel = lastFetchedAt ? formatDate(lastFetchedAt) : null;

  return (
    <div className="delivery-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-subtitle">Delivery Operations</p>
          <h1 className="dashboard-title">Hi {profile?.name || "there"}, here’s your day.</h1>
          {profile?.phone && <p className="dashboard-meta"> {profile.phone}</p>}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={handleLogout}
          >
            Logout
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={refreshOrders}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {lastUpdatedLabel && (
        <p className="last-updated">Last updated: {lastUpdatedLabel}</p>
      )}

      {isLoading ? (
        <div className="panel loading-panel">Loading your assignments…</div>
      ) : error ? (
        <div className="panel error-panel">{error}</div>
      ) : (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <p className="summary-label">Total orders</p>
              <p className="summary-value">{stats.total}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Active deliveries</p>
              <p className="summary-value accent">{stats.active}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Delivered</p>
              <p className="summary-value">{stats.delivered}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Earnings (est.)</p>
              <p className="summary-value">{currencyFormatter.format(stats.earnings)}</p>
            </article>
          </section>

          <section className="orders-section">
            <div className="orders-header">
              <h2>Assigned orders</h2>
              <div className="filter-group" role="radiogroup" aria-label="Filter orders by status">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`filter-chip ${statusFilter === filter.value ? "active" : ""}`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="panel empty-panel">
                <h3>No orders to show</h3>
                <p>
                  You’ll see assigned orders here once the operations team links you to a delivery.
                  Use the refresh button if you’re expecting a new assignment.
                </p>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => {
                  const transition = TRANSITIONS[order.delivery_status];
                  return (
                    <article key={order.id} className="order-card">
                      <header className="order-card-header">
                        <div>
                          <p className="order-id">Order #{order.id}</p>
                          <span className={getStatusPillClass(order.delivery_status)}>
                            {STATUS_LABELS[order.delivery_status] || order.delivery_status}
                          </span>
                        </div>
                        <div className="order-times">
                          <small>Placed {formatDate(order.placed_at)}</small>
                          {order.updated_at && <small>Updated {formatDate(order.updated_at)}</small>}
                        </div>
                      </header>

                      <div className="order-body">
                        <div className="order-details">
                          <div>
                            <p className="order-section-label">Farmer</p>
                            <p className="order-section-value">{order.farmer?.name || "—"}</p>
                          </div>
                          <div>
                            <p className="order-section-label">Buyer</p>
                            <p className="order-section-value">{order.buyer?.name || "—"}</p>
                          </div>
                          <div>
                            <p className="order-section-label">Delivery fee</p>
                            <p className="order-section-value">
                              {currencyFormatter.format(order.delivery_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="order-section-label">Order total</p>
                            <p className="order-section-value">
                              {currencyFormatter.format(order.total_price || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="order-locations">
                          <div>
                            <p className="order-section-label">Pickup</p>
                            <p className="order-section-value address">{order.pickup_address || "—"}</p>
                          </div>
                          <div>
                            <p className="order-section-label">Drop-off</p>
                            <p className="order-section-value address">{order.dropoff_address || "—"}</p>
                          </div>
                        </div>
                      </div>

                      {transition && (
                        <footer className="order-actions">
                          <button
                            type="button"
                            className="primary-button"
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusUpdate(order.id, order.delivery_status)}
                          >
                            {updatingId === order.id ? "Updating…" : transition.label}
                          </button>
                        </footer>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DeliveryDashboard;