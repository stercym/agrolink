import React from "react";
import styles from "./checkout.module.css";

export default function PaymentMethodSelector({ selected, onSelect }){
  return (
    <div className={styles.methods}>
      <label className={styles.method}>
        <input type="radio" name="pay" value="M-Pesa" checked={selected==="M-Pesa"} onChange={(e)=>onSelect(e.target.value)} />
        M-Pesa
      </label>
      <label className={styles.method}>
        <input type="radio" name="pay" value="Card" checked={selected==="Card"} onChange={(e)=>onSelect(e.target.value)} />
        Card (not enabled)
      </label>
      <label className={styles.method}>
        <input type="radio" name="pay" value="COD" checked={selected==="COD"} onChange={(e)=>onSelect(e.target.value)} />
        Cash on Delivery
      </label>
    </div>
  );
}
