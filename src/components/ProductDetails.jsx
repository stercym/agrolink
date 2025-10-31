import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";
import { useToast } from "./common/ToastProvider.jsx";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { pushToast } = useToast();

  useEffect(() => {
    // Fetch product details
    fetch(`http://127.0.0.1:5000/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        // Fetch farmer info
        return fetch(`http://127.0.0.1:5000/users/${data.farmer_id}`);
      })
      .then((res) => {
        if (!res.ok) throw new Error("Farmer not found");
        return res.json();
      })
      .then((farmerData) => {
        setFarmer(farmerData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Unable to load product details.");
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !product.is_available) {
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity: 1,
      farmerId: product.farmer_id,
      unit: product.unit,
      image: product.image_uri,
    });

    pushToast({
      type: "success",
      title: "Added to cart",
      message: `${product.name} is now in your basket.`,
    });
  };

  if (loading) return <p>Loading product...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!product) return <p>No product found.</p>;

  return (
    <div>
      <h2>{product.name}</h2>

      {product.image_uri && (
        <img
          src={product.image_uri}
          alt={product.name}
          width="300"
          style={{ display: "block", marginBottom: "10px" }}
        />
      )}

      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Price:</strong> ${product.price}</p>
      <p><strong>Quantity:</strong> {product.quantity}</p>
      <p><strong>Description:</strong> {product.description}</p>
      <p><strong>Location:</strong> {product.location}</p>
      <p><strong>Available:</strong> {product.is_available ? "Yes" : "No"}</p>

      {farmer && (
        <div style={{ marginTop: "15px" }}>
          <h4>Farmer Information</h4>
          <p><strong>Name:</strong> {farmer.name}</p>
          <p><strong>Location:</strong> {farmer.location}</p>
          <p><strong>Phone:</strong> {farmer.phone || "N/A"}</p>
        </div>
      )}

      <div style={{ marginTop: "15px" }}>
        <button onClick={handleAddToCart} disabled={!product.is_available}>
          {product.is_available ? "Add to Cart" : "Unavailable"}
        </button>
        <button style={{ marginLeft: "10px" }}>Contact Farmer</button>
      </div>

      <br />
      <Link to="/products">← Back to Products</Link>
    </div>
  );
}

export default ProductDetails;