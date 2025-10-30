import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCcw,
  Tag,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { api } from "../Config.jsx";
import { useToast } from "./common/ToastProvider.jsx";
import "./Dashboard.css";
import "./ManageCatalogue.css";

const AVAILABILITY_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "out_of_stock", label: "Out of stock" }
];

const deriveAvailability = (product) => {
  if (!product?.is_available) {
    return "paused";
  }

  const remaining = Number(product?.quantity ?? 0);
  return remaining > 0 ? "active" : "out_of_stock";
};

function ProductList() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    availability: "all",
    category: "all"
  });
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role !== "farmer") {
        navigate("/farmer-dashboard");
        return;
      }
      setUser(parsed);
    } catch (error) {
      console.error("Failed to parse stored user", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          include_unavailable: true,
          per_page: 100,
          farmer_id: user.id
        };

        if (filters.search.trim()) {
          params.q = filters.search.trim();
        }

        if (filters.category !== "all" && filters.category.trim()) {
          params.category = filters.category.trim();
        }

        const response = await api.get("/products", { params });
        if (cancelled) {
          return;
        }

        const items = Array.isArray(response.data?.products) ? response.data.products : [];
        const filtered = items.filter((product) => {
          const status = deriveAvailability(product);
          if (filters.availability === "all") {
            return true;
          }
          return status === filters.availability;
        });

        setProducts(filtered);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        console.error("Failed to load products", requestError);
        setError("We couldn\u2019t load your catalogue. Refresh and try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [filters, user]);

  const categories = useMemo(() => {
    const unique = new Set();
    products.forEach((product) => {
      if (product?.category) {
        unique.add(product.category);
      }
    });
    return ["all", ...Array.from(unique)];
  }, [products]);

  const inventoryStats = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const status = deriveAvailability(product);
        acc.total += 1;
        acc[status] += 1;
        acc.stockedUnits += Number(product.quantity ?? 0);
        return acc;
      },
      { total: 0, active: 0, paused: 0, out_of_stock: 0, stockedUnits: 0 }
    );
  }, [products]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: "", availability: "all", category: "all" });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Remove this product from your catalogue?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/products/${productId}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      pushToast({
        type: "success",
        title: "Product deleted",
        message: "The item is no longer visible in your marketplace listing."
      });
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (deleteError) {
      console.error("Failed to delete product", deleteError);
      pushToast({
        type: "error",
        title: "Couldn\u2019t delete product",
        message: "Please try again or refresh the page."
      });
    }
  };

  return (
    <main className="dashboard-shell">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-info">
            <h1 className="dashboard-title">Manage your product catalogue</h1>
            <p className="dashboard-subtitle">
              Keep listings fresh, adjust availability, and help buyers discover your produce sooner.
            </p>
          </div>
          <div className="dashboard-actions">
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-primary"
                onClick={() => navigate("/products/new")}
              >
                <Plus size={18} />
                Add a product
              </button>
            </div>
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-outline"
                onClick={handleResetFilters}
              >
                <RefreshCcw size={18} />
                Reset filters
              </button>
            </div>
          </div>
        </header>

        <section className="dashboard-section">
          <div className="dashboard-section__header manage-catalogue-controls">
            <div className="catalogue-search">
              <Search size={18} className="catalogue-search__icon" aria-hidden="true" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => handleFilterChange("search", event.target.value)}
                className="catalogue-search__input"
                placeholder="Search by name, variety, or note"
                aria-label="Search products"
              />
            </div>
            <div className="catalogue-filters">
              <div className="catalogue-filter">
                <Filter size={16} aria-hidden="true" />
                <span>Availability</span>
                <div className="catalogue-filter__options" role="group" aria-label="Availability filters">
                  {AVAILABILITY_FILTERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`catalogue-chip${filters.availability === option.id ? " is-active" : ""}`}
                      onClick={() => handleFilterChange("availability", option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="catalogue-select">
                <span>
                  <Tag size={16} aria-hidden="true" /> Category
                </span>
                <select
                  value={filters.category}
                  onChange={(event) => handleFilterChange("category", event.target.value)}
                >
                  {categories.map((categoryValue) => (
                    <option key={categoryValue} value={categoryValue}>
                      {categoryValue === "all" ? "All categories" : categoryValue}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="dashboard-section__body">
            <div className="manage-catalogue-summary">
              <div className="summary-card">
                <Package size={20} aria-hidden="true" />
                <div>
                  <p>Total listings</p>
                  <strong>{inventoryStats.total}</strong>
                </div>
              </div>
              <div className="summary-card">
                <MapPin size={20} aria-hidden="true" />
                <div>
                  <p>Units in stock</p>
                  <strong>{inventoryStats.stockedUnits}</strong>
                </div>
              </div>
              <div className="summary-card">
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <p>Out of stock</p>
                  <strong>{inventoryStats.out_of_stock}</strong>
                </div>
              </div>
            </div>

            {error && (
              <div className="status-banner error" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="dashboard-empty">
                <span className="dashboard-spinner" aria-hidden="true" />
                <p className="dashboard-empty__subtitle">Loading your catalogue...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="dashboard-empty">
                <Package size={40} aria-hidden="true" />
                <p className="dashboard-empty__title">No products match these filters</p>
                <p className="dashboard-empty__subtitle">
                  Adjust your filters or add a new listing to show here.
                </p>
              </div>
            ) : (
              <div className="dashboard-list">
                {products.map((product) => {
                  const status = deriveAvailability(product);
                  return (
                    <div key={product.id} className="dashboard-list-item catalog-list-item">
                      <div className="dashboard-list-item__meta">
                        {product.primary_image && (
                          <img
                            src={product.primary_image}
                            alt={product.name}
                            className="dashboard-thumb"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <div className="dashboard-meta-row catalog-meta-row">
                            <span>KSh {Number(product.price ?? 0).toLocaleString()} per {product.unit}</span>
                          </div>
                          <div className="catalog-status-row">
                            <span className={`catalog-status ${status === "active" ? "is-available" : "is-unavailable"}`}>
                              {status === "active" ? "Active" : status === "paused" ? "Paused" : "Out of stock"}
                            </span>
                            <span className="dashboard-pill">{product.quantity} in stock</span>
                          </div>
                        </div>
                      </div>
                      <div className="catalog-inline-actions">
                        <div className="catalog-inline-actions__row">
                          <button
                            type="button"
                            className="dashboard-link-button"
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="dashboard-link-button dashboard-danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProductList;