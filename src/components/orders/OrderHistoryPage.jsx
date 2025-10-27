import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import styles from "./Order.module.css";

export default function OrderHistoryPage(){
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // inline fetch to backend list orders
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/orders");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        // fallback to mock
        setOrders([{ id:1, total_amount:2050, order_status:"processing" }]);
      }
    })();
  }, []);

  return (
    <div className={styles.history}>
      <h2>My Orders</h2>
      {orders.length === 0 ? <p>No orders yet</p> : orders.map(o => <OrderCard key={o.id} order={o} />)}
    </div>
  );
}
