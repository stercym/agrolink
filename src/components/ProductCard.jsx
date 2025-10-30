import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";
import { useToast } from "./common/ToastProvider.jsx";

function ProductCard({ product }) {
  const {
    id,
    name,
    category,
    price,
    quantity,
    image_uri,
    description,
    is_available,
    farmer_id,
    unit,
  } = product;

  const { addItem } = useCart();
  const { pushToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isAdding) return;

    setIsAdding(true);

    addItem({
      id,
      name,
      price,
      quantity: 1,
      farmerId: farmer_id,
      unit,
      image: image_uri,
    });

    pushToast({
      type: "success",
      title: "Added to cart",
      message: `${name} is now in your basket.`,
    });

    window.setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <Link to={`/products/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div>
        <img src={image_uri || "/placeholder.jpg"} alt={name} width="200" height="150" />
        <h3>{name}</h3>
        <p>Category: {category}</p>
  <p>Price: ${price.toFixed(2)}</p>
        <p>Quantity: {quantity}</p>
        <p>Description: {description}</p>
        <p>Farmer ID: {farmer_id}</p>
        <p>Status: {is_available ? "Available" : "Out of Stock"}</p>
        <hr />
        <button type="button" onClick={handleAddToCart} disabled={isAdding || !is_available}>
          {isAvailableLabel(isAdding, is_available)}
        </button>
      </div>
    </Link>
  );
}

function isAvailableLabel(isAdding, isAvailable) {
  if (!isAvailable) return "Unavailable";
  return isAdding ? "Added" : "Add to cart";
}

export default ProductCard;