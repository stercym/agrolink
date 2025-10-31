import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import io from "socket.io-client";
import { api, BASE_URL } from "../Config.jsx";
import "./DeliveryTrackingBuyer.css";

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 }; // Fallback to Nairobi
const STATUS_STEPS = [
    { value: "processing", label: "Processing" },
    { value: "assigned", label: "Assigned" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
];

const toLatLng = (location) => {
    if (!location || location.latitude === null || location.longitude === null) {
        return null;
    }

    const lat = Number(location.latitude);
    const lng = Number(location.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return null;
    }

    return { lat, lng };
};

function DeliveryTrackingBuyer({ orderId }) {
    const [order, setOrder] = useState(null);
    const [tracking, setTracking] = useState(null);
    const [agentLocation, setAgentLocation] = useState(null);

    const socketRef = useRef(null);
    const agentIdRef = useRef(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const loadTracking = useCallback(async () => {
        try {
            const res = await api.get(`/api/orders/${orderId}/tracking`, {
                headers: authHeaders(),
            });

            if (!res.data) {
                return;
            }

            setOrder(res.data.order ?? null);
            setTracking(res.data.tracking ?? null);

            const liveCoords = res.data.tracking?.agent?.location;
            if (liveCoords) {
                const coords = toLatLng(liveCoords);
                if (coords) {
                    setAgentLocation(coords);
                }
            }
        } catch (error) {
            console.error("Failed to load delivery tracking:", error);
        }
    }, [authHeaders, orderId]);

    useEffect(() => {
        loadTracking();
    }, [loadTracking]);

    useEffect(() => {
        agentIdRef.current = tracking?.agent?.id ?? null;
    }, [tracking]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("Buyer tracking socket connection skipped: missing token.");
            return undefined;
        }

        const client = io(BASE_URL, { auth: { token } });
        socketRef.current = client;

        client.on("delivery_status_update", (payload) => {
            if (payload?.order_id === Number(orderId)) {
                setOrder((prev) => (prev ? { ...prev, delivery_status: payload.delivery_status } : prev));
                setTracking((prev) => (prev ? { ...prev, status: payload.delivery_status } : prev));
            }
        });

        client.on("agent_location_update", (payload) => {
            if (payload?.agent_id && payload.agent_id === agentIdRef.current) {
                const coords = { lat: Number(payload.lat), lng: Number(payload.lng) };
                if (!Number.isNaN(coords.lat) && !Number.isNaN(coords.lng)) {
                    setAgentLocation(coords);
                }
            }
        });

        return () => {
            client.disconnect();
            socketRef.current = null;
        };
    }, [orderId]);

    const pickupPoint = useMemo(() => toLatLng(tracking?.pickup?.location), [tracking]);
    const dropoffPoint = useMemo(() => toLatLng(tracking?.dropoff?.location), [tracking]);

    const mapCenter = useMemo(() => {
        if (agentLocation) return agentLocation;
        if (dropoffPoint) return dropoffPoint;
        if (pickupPoint) return pickupPoint;
        return DEFAULT_CENTER;
    }, [agentLocation, dropoffPoint, pickupPoint]);

    const currentStatus = order?.delivery_status || tracking?.status || "processing";
    const currentStepIndex = STATUS_STEPS.findIndex((step) => step.value === currentStatus);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    if (!isLoaded || !order || !tracking) {
        return <div className="loading">Loading tracking data...</div>;
    }

    return (
        <div className="tracking-wrapper">
            <h2>
                Order #{order.id} — {currentStatus.replace(/_/g, " ")}
            </h2>

            <div className="map-wrapper">
                <GoogleMap mapContainerClassName="map-container" center={mapCenter} zoom={11}>
                    {pickupPoint && <Marker position={pickupPoint} label="P" />}
                    {dropoffPoint && <Marker position={dropoffPoint} label="D" />}
                    {agentLocation && <Marker position={agentLocation} label="A" />}
                </GoogleMap>
            </div>

            <div className="progress-container">
                <strong>Progress:</strong>
                <div className="progress-status">
                    {STATUS_STEPS.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isDone = currentStepIndex !== -1 && index < currentStepIndex;
                        const classes = ["status-dot"];
                        if (isDone) classes.push("done");
                        if (isActive) classes.push(`active-${step.value}`);

                        return (
                            <span key={step.value} className={classes.join(" ")}>
                                {step.label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default DeliveryTrackingBuyer;