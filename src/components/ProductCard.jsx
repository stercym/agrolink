import React from "react";
import { Link } from "react-router-dom";

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
  } = product;

  const priceNumber = parseFloat(price);
  if (isNaN(priceNumber)) {
    console.error(`Invalid price for product ${name}: ${price}`);
  }
  return (
    <Link
      to={`/products/${id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div>
        <img
          src={image_uri || "/placeholder.jpg"}
          alt={name}
          width="200"
          height="150"
        />
        <h3>{name}</h3>
        <p>Category: {category}</p>
        <p>Price: ${price.toFixed(2)}</p>
        <p>Quantity: {quantity}</p>
        <p>Description: {description}</p>
        <p>Farmer ID: {farmer_id}</p>
        <p>Status: {is_available ? "Available" : "Out of Stock"}</p>
        <hr />
      </div>
    </Link>
  );
}

export default ProductCard;


