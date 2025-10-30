const API_URL = "https://agrolink-backend-nezp.onrender.com";

// Get all products
function getProducts() {
  return fetch(`${API_URL}/products`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
      // RETURN safe default so callers don't get `undefined`
      return [];
    });
}

// Get a single product
function getProduct(id) {
  return fetch(`${API_URL}/products/${id}`)
    .then((res) => res.json())
    .catch((err) => console.error("Error fetching product:", err));
}

// Create new product
function createProduct(productData) {
  return fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  })
    .then((res) => res.json())
    .catch((err) => console.error("Error creating product:", err));
}

// Upload image to Cloudinary through backend
function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => data.url)
    .catch((err) => console.error("Error uploading image:", err));
}

// Update product
function updateProduct(id, updatedData) {
  return fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  })
    .then((res) => res.json())
    .catch((err) => console.error("Error updating product:", err));
}

// Delete product
function deleteProduct(id) {
  return fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .catch((err) => console.error("Error deleting product:", err));
}

// Export all functions
export {
  getProducts,
  getProduct,
  createProduct,
  uploadImage,
  updateProduct,
  deleteProduct,
};
