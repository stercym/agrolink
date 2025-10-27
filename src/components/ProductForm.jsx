import React, { useState } from "react";
import { createProduct, uploadImage } from "./api";

function ProductForm({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    description: "",
    location: "",
    category: "",
    image_uri: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadImage(file);
    setForm({ ...form, image_uri: res });
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createProduct(form);
    onAdded();
    setForm({
      name: "",
      price: "",
      quantity: "",
      description: "",
      location: "",
      category: "",
      image_uri: "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Product</h3>
      <input
        name="name"
        placeholder="Product name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="category"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
      />
      <input
        name="price"
        placeholder="Price"
        type="number"
        value={form.price}
        onChange={handleChange}
        required
      />
      <input
        name="quantity"
        placeholder="Quantity"
        type="number"
        value={form.quantity}
        onChange={handleChange}
        required
      />
      <input
        name="location"
        placeholder="Location"
        value={form.location}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />
      <input type="file" onChange={handleFileUpload} />
      {uploading && <p>Uploading image...</p>}
      <button type="submit">Add Product</button>
    </form>
  );
}

export default ProductForm;

