import React from "react";
import { Link } from "react-router-dom";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { useCart } from "./CartContext";
import styles from "./Cart.module.css";


function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, isSyncing, lastSyncError } = useCart();

  if (!items.length) {
    return (
      <section className={styles.cartPage}>
        <h2>Your Cart</h2>
        <p className={styles.emptyCopy}>Your basket is empty right now.</p>
        <Link to="/" className={styles.ctaLink}>
          Browse fresh produce
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.cartPage}>
      <header className={styles.cartHeader}>
        <div>
          <h2>Your Cart</h2>
          {isSyncing && <p className={styles.syncStatus}>Syncing with AgroLink...</p>}
          {lastSyncError && <p className={styles.syncError}>{lastSyncError}</p>}
        </div>
        <button type="button" className={styles.clearButton} onClick={clearCart}>
          Clear cart
        </button>
      </header>
      <div className={styles.cartList}>
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdate={updateQuantity}
          />
        ))}
      </div>
      <CartSummary />
    </section>
  );
}
export default CartPage;