import React, { useState } from "react";
import CheckoutForm from "./CheckoutForm";
import OrderReview from "./OrderReview";
import PaymentMethodSelector from "./PaymentMethodSelector";
import styles from "./checkout.module.css";


export default function CheckoutPage(){
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [orderData, setOrderData] = useState(null);
  const [showMpesa, setShowMpesa] = useState(false);

  const handleSubmit = async (customer) => {
    // Build minimal order payload — replace with cart data
    const items = [
      { product_id: 1, name: "Tomatoes", quantity: 2, price: 1200 },
      { product_id: 2, name: "Cabbage", quantity: 1, price: 850 }
    ];
    const total = items.reduce((s,i)=> s + i.price * i.quantity,0);

    const payload = {
      buyer_id: 1,
      farmer_id: 1,
      items,
      total_amount: total,
      delivery_option: "pickup",
      customer
    };

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to place order");
      const data = await res.json();
      setOrderData({ orderId: data.id || data.order_id || data.order_id });
      // If M-Pesa selected, open modal to initiate payment
      if (paymentMethod === "M-Pesa") setShowMpesa(true);
      else alert("Order placed. Use payments page to pay.");
    } catch (err) {
      alert("Order placement failed. " + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Checkout</h2>
      <OrderReview />
      <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
      <CheckoutForm onSubmit={handleSubmit} />
      { showMpesa && orderData && (
        <MpesaPaymentModal orderId={orderData.orderId} onClose={() => setShowMpesa(false)} />
      )}
    </div>
  );
}
