// ProductCard.js
import React from "react";
import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <div>
      <Link to={`/products/${product.id}`}>
        <h2>{product.name}</h2>
        <p>Category: {product.category}</p>
        <p>Price: {product.price}</p>
        <p>Quantity: {product.quantity}</p>
        {product.image_uri && (
          <img src={product.image_uri} alt={product.name} width="150" />
        )}
      </Link>
    </div>
  );
}

export default ProductCard;

