import React, { useEffect, useState } from "react";
import "./DeliveryGroupSummary.css";

function DeliveryGroupSummary() {
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        fetch("/api/delivery_groups")
            .then((r) => r.json())
            .then(setGroups);
    }, []);

    return (
        <div className="summary-container">
            <h2>Delivery Group Summary</h2>
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
                    {groups.map((g) => (
                        <tr key={g.agent_id}>
                            <td>{g.agent_name}</td>
                            <td>{g.active}</td>
                            <td>{g.completed}</td>
                            <td>{g.pending}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DeliveryGroupSummary;
