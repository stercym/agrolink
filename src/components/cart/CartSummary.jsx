import React from "react";
import styles from "./Cart.module.css";
import { Link } from "react-router-dom";

export default function CartSummary({ items }) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return (
    <div className={styles.cartSummary}>
      <h3>Total: KSh {total}</h3>
      <Link to="/checkout">
        <button>Proceed to Checkout</button>
      </Link>
    </div>
  );
}
