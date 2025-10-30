import React, { useEffect, useState } from "react";
import { api } from "../Config.jsx";
import "./DeliveryGroupSummary.css";

function DeliveryGroupSummary() {
    const [summary, setSummary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        api.get("/api/delivery-groups", { headers })
            .then((res) => {
                setSummary(res.data?.agent_summary ?? []);
            })
            .catch((error) => {
                console.error("Failed to load delivery group summary:", error);
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="summary-container">
            <h2>Delivery Group Summary</h2>

            {isLoading ? (
                <p>Loading delivery metrics...</p>
            ) : summary.length === 0 ? (
                <p>No delivery assignments recorded yet.</p>
            ) : (
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Active Deliveries</th>
                            <th>Completed Deliveries</th>
                            <th>Pending Deliveries</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map((item) => (
                            <tr key={item.agent_id}>
                                <td>{item.agent_name}</td>
                                <td>{item.active}</td>
                                <td>{item.completed}</td>
                                <td>{item.pending}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default DeliveryGroupSummary;