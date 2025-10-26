import React from "react";
import OrderTracking from "./OrderTracking";
import styles from "./Order.module.css";

export default function OrderCard({ order }){
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div>Order #{order.id}</div>
        <div>KSh {order.total_amount}</div>
      </div>
      <div className={styles.row}>
        <div>Status: <strong>{order.order_status || "processing"}</strong></div>
      </div>
      <OrderTracking status={order.order_status || "processing"} />
    </div>
  );
}
