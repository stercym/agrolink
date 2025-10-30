import React, { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { api, BASE_URL } from "../Config.jsx";
import "./DeliveryDashboardAgent.css";

const STATUS_OPTIONS = [
    { value: "assigned", label: "Assigned" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
];

function DeliveryDashboardAgent({ agentId }) {
    const [orders, setOrders] = useState([]);
    const [location, setLocation] = useState(null);
    const [agentProfile, setAgentProfile] = useState(null);

    const socketRef = useRef(null);
    const watchIdRef = useRef(null);
    const agentIdRef = useRef(agentId);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const loadProfile = useCallback(async () => {
        try {
            const res = await api.get("/api/delivery-agents/me/status", {
                headers: authHeaders(),
            });
            setAgentProfile(res.data?.agent ?? null);
        } catch (error) {
            console.error("Failed to load agent profile:", error);
        }
    }, [authHeaders]);

    const loadOrders = useCallback(async () => {
        try {
            const res = await api.get("/api/delivery-agents/me/orders", {
                headers: authHeaders(),
            });
            setOrders(res.data?.orders ?? []);
        } catch (error) {
            console.error("Failed to load delivery orders:", error);
        }
    }, [authHeaders]);

    useEffect(() => {
        loadProfile();
        loadOrders();
    }, [loadOrders, loadProfile]);

    useEffect(() => {
        agentIdRef.current = agentProfile?.id ?? agentId ?? agentIdRef.current;
    }, [agentId, agentProfile]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("Delivery agent socket connection skipped: missing token.");
            return undefined;
        }

        const client = io(BASE_URL, { auth: { token } });
        socketRef.current = client;

        client.on("delivery_status_update", (payload) => {
            if (!payload?.order_id) return;
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === payload.order_id
                        ? { ...order, delivery_status: payload.delivery_status }
                        : order
                )
            );
        });

        client.on("agent_location_update", (payload) => {
            if (payload?.agent_id === agentIdRef.current) {
                setLocation({ lat: payload.lat, lng: payload.lng });
            }
        });

        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                async (pos) => {
                    const coords = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    setLocation(coords);

                    try {
                        await api.patch(
                            "/api/delivery-agents/me/status",
                            { latitude: coords.lat, longitude: coords.lng },
                            { headers: authHeaders() }
                        );
                    } catch (error) {
                        console.error("Failed to persist agent location:", error);
                    }

                    client.emit("agent_location_update", {
                        agent_id: agentIdRef.current,
                        lat: coords.lat,
                        lng: coords.lng,
                    });
                },
                (err) => console.error("Location error:", err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }

        return () => {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            client.disconnect();
        };
    }, [authHeaders]);

    const updateOrderStatus = useCallback(
        async (orderId, newStatus) => {
            try {
                const res = await api.patch(
                    `/api/orders/${orderId}/status`,
                    { delivery_status: newStatus },
                    { headers: authHeaders() }
                );

                const updated = res.data?.order;
                if (!updated) {
                    return;
                }

                setOrders((prev) =>
                    prev.map((order) => (order.id === updated.id ? updated : order))
                );

                socketRef.current?.emit("delivery_status_update", {
                    order_id: updated.id,
                    delivery_status: updated.delivery_status,
                });
            } catch (error) {
                console.error("Failed to update order status:", error);
            }
        },
        [authHeaders]
    );

    const resolvedAgentId = agentProfile?.id ?? agentId ?? "me";

    return (
        <div className="agent-dashboard">
            <h2>Delivery Dashboard — Agent #{resolvedAgentId}</h2>

            {location && (
                <p className="location-info">
                    📍 Current Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
            )}

            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Pickup</th>
                        <th>Dropoff</th>
                        <th>Status</th>
                        <th>Update</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.pickup_address || "—"}</td>
                            <td>{order.dropoff_address || "—"}</td>
                            <td className={`status ${order.delivery_status}`}>
                                {order.delivery_status?.replace(/_/g, " ")}
                            </td>
                            <td>
                                <select
                                    value={order.delivery_status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr>
                            <td colSpan={5}>No assigned deliveries yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DeliveryDashboardAgent;