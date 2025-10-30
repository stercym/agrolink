import React from "react";
import styles from "./checkout.module.css";

function resolveMessage(status, message, orderId) {
  if (message) return message;
  if (status === "error") {
    return "We could not initiate the STK push. You can retry payment from your orders.";
  }
  return `We just sent an STK push to your phone for order ${orderId}.`;
}

export default function MpesaPaymentModal({ orderId, onClose, status = "success", message }) {
  const resolvedMessage = resolveMessage(status, message, orderId);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <button
          type="button"
          className={styles.modalClose}
          aria-label="Close"
          onClick={onClose}
        >
          x
        </button>
        <h3>M-Pesa payment</h3>
        <p className={`${styles.modalLead} ${status === "error" ? styles.modalError : ""}`}>
          {resolvedMessage}
        </p>
        {status !== "error" && (
          <ol className={styles.modalList}>
            <li>Check your Safaricom phone for the pop-up prompt.</li>
            <li>Confirm the amount and enter your M-Pesa PIN.</li>
            <li>Keep the confirmation SMS for your records.</li>
          </ol>
        )}
        <button type="button" className={styles.modalCta} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}