// src/components/ProductList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "./api";
import ProductCard from "./ProductCard";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  useEffect(() => {
    getProducts().then((data) => setProducts(data || []));
  }, []);

  const filteredProducts = products.filter((p) => {
    const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filterCategory
      ? p.category?.toLowerCase() === filterCategory.toLowerCase()
      : true;
    const locationMatch = filterLocation
      ? p.location?.toLowerCase() === filterLocation.toLowerCase()
      : true;
    const priceMatch = filterPrice ? p.price <= parseFloat(filterPrice) : true;

    return nameMatch && categoryMatch && locationMatch && priceMatch;
  });

  return (
    <div>
      <h2>Product Catalog</h2>

      <input
        type="text"
        placeholder="Search product..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <input
        type="text"
        placeholder="Filter by category..."
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
      />

      <input
        type="text"
        placeholder="Filter by location..."
        value={filterLocation}
        onChange={(e) => setFilterLocation(e.target.value)}
      />

      <input
        type="number"
        placeholder="Max price..."
        value={filterPrice}
        onChange={(e) => setFilterPrice(e.target.value)}
      />

      <div>
        <Link to="/products/new">
          <button>Create Product</button>
        </Link>
      </div>

      {filteredProducts.length > 0 ? (
        filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)
      ) : (
        <p>No products found</p>
      )}
    </div>
  );
}

export default ProductList;

