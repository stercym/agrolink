import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckoutForm from "./CheckoutForm";
import OrderReview from "./OrderReview";
import PaymentMethodSelector from "./PaymentMethodSelector";
import MpesaPaymentModal from "./MpesaPaymentModal";
import styles from "./checkout.module.css";
import { useCart } from "../cart/CartContext";
import { useToast } from "../common/ToastProvider.jsx";
import { api } from "../../Config.jsx";

function normalisePhone(phone) {
  return phone.replace(/\s+/g, "").trim();
}

function normaliseLocationPayload(form) {
  return {
    label: form.label.trim(),
    address_line: form.addressLine.trim(),
    city: form.city.trim(),
    region: form.region.trim(),
    country: (form.country || "Kenya").trim(),
    postal_code: form.postalCode.trim() || null,
  };
}

async function ensureShippingLocation(addressPayload, headers) {
  try {
    const response = await api.get("/api/locations", { headers });
    const locations = response.data?.locations || [];
    const match = locations.find((location) => {
      const sameAddress = (location.address_line || "").toLowerCase() === addressPayload.address_line.toLowerCase();
      const sameCity = (location.city || "").toLowerCase() === addressPayload.city.toLowerCase();
      const sameRegion = (location.region || "").toLowerCase() === addressPayload.region.toLowerCase();
      return sameAddress && sameCity && sameRegion;
    });

    if (match) {
      return match.id;
    }
  } catch (error) {
    console.warn("Failed to load existing locations", error);
  }

  const creation = await api.post("/api/locations", addressPayload, { headers });
  const locationId = creation.data?.location?.id;
  if (!locationId) {
    throw new Error("We could not save your delivery address");
  }
  return locationId;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, syncToServer } = useCart();
  const { pushToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [orderData, setOrderData] = useState(null);
  const [showMpesa, setShowMpesa] = useState(false);
  const [mpesaFeedback, setMpesaFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const hasItems = items.length > 0;

  const handleSubmit = async (form) => {
    if (!hasItems) {
      const message = "Add items to your cart before checking out.";
      setStatus({ type: "error", message });
      pushToast({ type: "error", title: "Cart empty", message });
      return;
    }

    const token = window.localStorage.getItem("token");
    const rawUser = window.localStorage.getItem("user");
    let role = null;

    if (rawUser) {
      try {
        role = JSON.parse(rawUser)?.role || null;
      } catch (error) {
        console.warn("Failed to parse stored user", error);
      }
    }

    if (!token) {
      const message = "Please sign in to place an order.";
      setStatus({ type: "error", message });
      pushToast({ type: "error", title: "Sign in required", message });
      navigate("/login", { replace: true, state: { redirectTo: "/checkout" } });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setMpesaFeedback(null);

    const syncResult = await syncToServer();
    if (syncResult?.error) {
      setStatus({ type: "error", message: syncResult.error });
      setIsSubmitting(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const addressPayload = normaliseLocationPayload(form);
      const shippingAddressId = await ensureShippingLocation(addressPayload, headers);
      const orderResponse = await api.post(
        "/api/orders",
        {
          shipping_address_id: shippingAddressId,
          payment_method: paymentMethod,
          delivery_instructions: form.instructions || null,
          contact_name: form.name.trim(),
          contact_phone: normalisePhone(form.phone),
        },
        { headers }
      );

      const order = orderResponse.data?.order;
      if (!order?.id) {
        throw new Error("Order creation failed");
      }

      setOrderData({ orderId: order.id, paymentMethod, order });
      setStatus({ type: "success", message: "Order placed! We will confirm your delivery shortly." });
      pushToast({ type: "success", title: "Order placed", message: "We are preparing your delivery." });
      clearCart();

      if (paymentMethod === "M-Pesa") {
        try {
          await api.post(`/api/orders/${order.id}/payment`, {}, { headers });
          setMpesaFeedback({ type: "success", message: "Check your phone for the M-Pesa prompt." });
          pushToast({
            type: "success",
            title: "M-Pesa initiated",
            message: "Enter your PIN on the STK prompt to complete payment.",
          });
        } catch (paymentError) {
          const paymentMessage =
            paymentError.response?.data?.error ||
            "We could not initiate M-Pesa right now. You can retry from your orders.";
          setMpesaFeedback({ type: "error", message: paymentMessage });
          pushToast({ type: "error", title: "M-Pesa error", message: paymentMessage });
        } finally {
          setShowMpesa(true);
        }
      } else {
        pushToast({
          type: "info",
          title: "Cash on delivery",
          message: "Have the cash ready for your delivery agent.",
        });
        setShowMpesa(false);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Something went wrong placing your order.";
      setStatus({ type: "error", message });
      pushToast({ type: "error", title: "Checkout failed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <h2>Checkout</h2>
          <p>Secure your produce and schedule delivery in a few steps.</p>
        </header>

        {status && (
          <div
            className={`${styles.alert} ${
              status.type === "error" ? styles.alertError : styles.alertSuccess
            }`}
          >
            {status.message}
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            <OrderReview />
            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
          </div>
          <div className={styles.rightColumn}>
            <CheckoutForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              disabled={!hasItems}
            />
            {paymentMethod === "M-Pesa" && (
              <p className={styles.paymentHint}>
                Keep your phone close - you will receive an STK prompt once you confirm the order.
              </p>
            )}
          </div>
        </div>
      </section>

      {showMpesa && orderData && (
        <MpesaPaymentModal
          orderId={orderData.orderId}
          status={mpesaFeedback?.type || "success"}
          message={mpesaFeedback?.message}
          onClose={() => setShowMpesa(false)}
        />
      )}
    </div>
  );
}