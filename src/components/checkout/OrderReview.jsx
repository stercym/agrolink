import React from "react";
import styles from "./checkout.module.css";
import { useCart } from "../cart/CartContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function OrderReview() {
  const { items, total } = useCart();
  const deliveryFee = items.length ? 150 : 0;
  const grandTotal = total + deliveryFee;

  return (
    <section className={styles.review}>
      <header className={styles.reviewHeader}>
        <h3>Order summary</h3>
        <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
      </header>

      {!items.length && (
        <p className={styles.reviewEmpty}>Add items to your cart to check out.</p>
      )}

      {!!items.length && (
        <ul className={styles.reviewList}>
          {items.map((item) => (
            <li key={item.id} className={styles.reviewItem}>
              <div>
                <p className={styles.reviewName}>{item.name}</p>
                <span className={styles.reviewMeta}>Qty {item.quantity} @ {formatCurrency(item.price)}</span>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </li>
          ))}
        </ul>
      )}

      <dl className={styles.reviewTotals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{deliveryFee ? formatCurrency(deliveryFee) : "FREE"}</dd>
        </div>
        <div className={styles.reviewGrandTotal}>
          <dt>Total due</dt>
          <dd>{formatCurrency(grandTotal)}</dd>
        </div>
      </dl>
    </section>
  );
}