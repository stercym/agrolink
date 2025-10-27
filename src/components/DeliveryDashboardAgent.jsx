import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./DeliveryDashboardAgent.css";

const socket = io("/");

function DeliveryDashboardAgent({ agentId }) {
    const [orders, setOrders] = useState([]);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Fetch assigned orders
        fetch(`/api/agents/${agentId}/orders`)
            .then((r) => r.json())
            .then(setOrders);

        // Watch agent’s location
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const coords = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    setLocation(coords);
                    socket.emit("agent_location_update", {
                        agent_id: agentId,
                        ...coords,
                    });
                },
                (err) => console.error("Location error:", err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }

        return () => {
            socket.disconnect();
        };
    }, [agentId]);

    const updateOrderStatus = (orderId, newStatus) => {
        fetch(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delivery_status: newStatus }),
        })
            .then((r) => r.json())
            .then((updated) => {
                setOrders((prev) =>
                    prev.map((o) => (o.id === updated.id ? updated : o))
                );
                socket.emit("delivery_status_update", updated);
            });
    };

    return (
        <div className="agent-dashboard">
            <h2>Delivery Dashboard — Agent #{agentId}</h2>

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
                            <td>{order.pickup_address}</td>
                            <td>{order.dropoff_address}</td>
                            <td className={`status ${order.delivery_status}`}>
                                {order.delivery_status}
                            </td>
                            <td>
                                <select
                                    value={order.delivery_status}
                                    onChange={(e) =>
                                        updateOrderStatus(order.id, e.target.value)
                                    }
                                >
                                    <option value="processing">Processing</option>
                                    <option value="en_route">En Route</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DeliveryDashboardAgent;
