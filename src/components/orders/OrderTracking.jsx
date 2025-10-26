import React from "react";
import styles from "./Order.module.css";

export default function OrderTracking({ status }){
  const steps = ["placed","processing","delivered"];
  const idx = Math.max(0, steps.indexOf(status?.toLowerCase()));
  return (
    <div className={styles.track}>
      {steps.map((s,i) => (
        <div key={s} className={`${styles.step} ${i<=idx ? styles.active : ""}`}>{s}</div>
      ))}
    </div>
  );
}
