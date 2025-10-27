import React from "react";
import styles from "./Cart.module.css";

export default function CartItem({ item, onRemove }) {
  return (
    <div className={styles.cartItem}>
      <p>{item.name}</p>
      <p>KSh {item.price}</p>
      <p>Qty: {item.qty}</p>
      <button onClick={() => onRemove(item.id)}>Remove</button>
    </div>
  );
}
