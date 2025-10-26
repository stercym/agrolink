import React, { useState } from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import styles from "./Cart.module.css";


export default function CartPage() {
  const [items, setItems] = useState([
    { id: 1, name: "Tomatoes", price: 100, qty: 2 },
    { id: 2, name: "Potatoes", price: 150, qty: 1 },
  ]);

  const handleRemove = (id) => setItems(items.filter((item) => item.id !== id));

  return (
    <div className={styles.cartPage}>
      <h2>Your Cart</h2>
      {items.map((item) => (
        <CartItem key={item.id} item={item} onRemove={handleRemove} />
      ))}
      <CartSummary items={items} />
    </div>
  );
}
