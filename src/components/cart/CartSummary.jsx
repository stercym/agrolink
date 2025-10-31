import React from "react";
import styles from "./Cart.module.css";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(value);
}

function CartSummary() {
  const { total, itemCount, isSyncing } = useCart();

  const handleClick = (event) => {
    if (isSyncing) {
      event.preventDefault();
    }
  };

  return (
    <footer className={styles.cartSummary}>
      <div>
        <p className={styles.summaryCount}>{itemCount} item{itemCount === 1 ? "" : "s"}</p>
        <h3 className={styles.summaryTotal}>{formatCurrency(total)}</h3>
      </div>
      <Link
        to="/checkout"
        onClick={handleClick}
        aria-disabled={isSyncing}
        className={`${styles.checkoutCta} ${isSyncing ? styles.checkoutDisabled : ""}`}
      >
        Proceed to checkout
      </Link>
    </footer>
  );
}

export default CartSummary;