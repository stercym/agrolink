import React from "react";
import styles from "./Cart.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(value);
}

const CartItem = ({ item, onRemove, onUpdate }) => {
  const handleQuantityChange = (event) => {
    const next = event.target.value;
    onUpdate(item.id, next);
  };

  return (
    <article className={styles.cartItem}>
      <div className={styles.itemInfo}>
        {item.image ? (
          <img src={item.image} alt={item.name} className={styles.itemImage} />
        ) : (
          <div className={styles.itemPlaceholder}>{item.name.charAt(0)}</div>
        )}
        <div>
          <h4>{item.name}</h4>
          <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
        </div>
      </div>

      <div className={styles.itemControls}>
        <label className={styles.quantityControl}>
          Qty
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
          />
        </label>
        <p className={styles.lineTotal}>{formatCurrency(item.price * item.quantity)}</p>
        <button type="button" onClick={() => onRemove(item.id)} className={styles.removeButton}>
          Remove
        </button>
      </div>
    </article>
  );
};

export default CartItem;