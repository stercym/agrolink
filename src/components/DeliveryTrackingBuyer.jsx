import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import io from "socket.io-client";
import "./DeliveryTrackingBuyer.css";

const socket = io("/");

function DeliveryTrackingBuyer({ orderId }) {
    const [order, setOrder] = useState(null);
    const [agentLocation, setAgentLocation] = useState(null);
    const [routePolyline, setRoutePolyline] = useState(null);

    useEffect(() => {
        // Fetch order details
        fetch(`/api/orders/${orderId}`)
            .then((r) => r.json())
            .then(setOrder);

        // Listen for live updates
        socket.on("agent_location_update", (data) => {
            if (!order) return;
            setAgentLocation({ lat: data.lat, lng: data.lng });
        });

        socket.on("delivery_status_update", (data) => {
            if (data.order_id === orderId)
                setOrder((prev) => ({ ...prev, delivery_status: data.delivery_status }));
        });

        return () => {
            socket.off("agent_location_update");
            socket.off("delivery_status_update");
        };
    }, [orderId, order]);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    });

    if (!isLoaded || !order) return <div className="loading">Loading map...</div>;

    const center = { lat: order.pickup_lat, lng: order.pickup_lng };

    return (
        <div className="tracking-wrapper">
            <h2>
                Order #{order.id} — {order.delivery_status}
            </h2>

            <div className="map-wrapper">
                <GoogleMap
                    mapContainerClassName="map-container"
                    center={center}
                    zoom={11}
                >
                    <Marker position={{ lat: order.pickup_lat, lng: order.pickup_lng }} label="P" />
                    <Marker position={{ lat: order.dropoff_lat, lng: order.dropoff_lng }} label="D" />
                    {agentLocation && <Marker position={agentLocation} label="R" />}
                    {routePolyline && <Polyline path={routePolyline} options={{ strokeColor: "#2e7d32" }} />}
                </GoogleMap>
            </div>

            <div className="progress-container">
                <strong>Progress:</strong>
                <div className="progress-status">
                    <span
                        className={`status-dot ${order.delivery_status === "processing" ? "active-processing" : "done"
                            }`}
                    >
                        Processing
                    </span>
                    <span
                        className={`status-dot ${order.delivery_status === "en_route"
                                ? "active-enroute"
                                : order.delivery_status === "delivered"
                                    ? "done"
                                    : ""
                            }`}
                    >
                        En Route
                    </span>
                    <span
                        className={`status-dot ${order.delivery_status === "delivered" ? "done" : ""
                            }`}
                    >
                        Delivered
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DeliveryTrackingBuyer;
