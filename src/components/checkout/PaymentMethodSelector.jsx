import React from "react";
import styles from "./checkout.module.css";

export default function PaymentMethodSelector({ selected, onSelect }) {
  return (
    <fieldset className={styles.methods}>
      <legend>Payment method</legend>
      <label
        className={`${styles.method} ${
          selected === "M-Pesa" ? styles.methodSelected : ""
        }`}
      >
        <input
          type="radio"
          name="payment"
          value="M-Pesa"
          checked={selected === "M-Pesa"}
          onChange={(event) => onSelect(event.target.value)}
        />
        <span>
          <strong>M-Pesa</strong>
          <small>Instant STK push after placing your order</small>
        </span>
      </label>
      <label
        className={`${styles.method} ${
          selected === "COD" ? styles.methodSelected : ""
        }`}
      >
        <input
          type="radio"
          name="payment"
          value="COD"
          checked={selected === "COD"}
          onChange={(event) => onSelect(event.target.value)}
        />
        <span>
          <strong>Cash on Delivery</strong>
          <small>Pay the delivery agent on arrival</small>
        </span>
      </label>
    </fieldset>
  );
}