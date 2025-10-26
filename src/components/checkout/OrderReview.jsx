import React from "react";
import styles from "./checkout.module.css";

export default function OrderReview() {
  const mockItems = [
    { name: "Tomatooes", price: 300, qty: 2 },
    { name: "Cabbage", price: 900, qty: 1 },
  ];

  const total = mockItems.reduce((t, i) => t + i.price * i.qty, 0);

  return (
    <div className={styles.orderReview}>
      <h3>Order Summary</h3>
      <ul>
        {mockItems.map((item, i) => (
          <li key={i}>
            {item.name} x{item.qty} - KSh {item.price * item.qty}
          </li>
        ))}
      </ul>
      <strong>Total: KSh {total}</strong>
    </div>
  );
}
