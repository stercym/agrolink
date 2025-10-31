import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { api } from "../Components";
import { useToast } from "./common/ToastProvider.jsx";
import "./Dashboard.css";
import "./ManageCatalogue.css";
import "./ProductEditor.css";

const UNIT_OPTIONS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "bags", label: "Bags" },
  { value: "crates", label: "Crates" },
  { value: "tonnes", label: "Tonnes" },
  { value: "bunches", label: "Bunches" },
  { value: "litres", label: "Litres" },
];

const INITIAL_FORM = {
  name: "",
  category: "",
  unit: "kg",
  price: "",
  quantity: "",
  description: "",
  is_available: true,
};

const extractPrimaryImage = (product) => {
  if (!product) {
    return "";
  }

  if (product.primary_image) {
    return product.primary_image;
  }

  if (product.image_uri) {
    return product.image_uri;
  }

  if (Array.isArray(product.images)) {
    const primary = product.images.find((image) => image.is_primary);
    if (primary) {
      return primary.image_uri;
    }

    if (product.images.length > 0) {
      return product.images[0].image_uri;
    }
  }

  return "";
};

function ProductEditor({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pushToast } = useToast();

  const isEditMode = mode === "edit";
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.role !== "farmer") {
        navigate("/farmer-dashboard");
        return;
      }
      setAuthChecked(true);
    } catch (parseError) {
      console.warn("Failed to parse stored user", parseError);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!isEditMode || !authChecked) {
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/products/${id}`);
        if (cancelled) {
          return;
        }

        const product = response.data?.product ?? response.data;
        if (!product) {
          setError("We couldn't find that product.");
          return;
        }

        setForm({
          name: product.name || "",
          category: product.category || "",
          unit: product.unit || "kg",
          price: product.price !== undefined && product.price !== null ? String(product.price) : "",
          quantity: product.quantity !== undefined && product.quantity !== null ? String(product.quantity) : "",
          description: product.description || "",
          is_available: product.is_available !== undefined ? Boolean(product.is_available) : true,
        });

        const preview = extractPrimaryImage(product);
        setImagePreview(preview || "");
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        console.error("Failed to load product", requestError);
        const message = requestError.response?.data?.error || "Unable to load product details.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [authChecked, id, isEditMode]);

  const unitOptions = useMemo(() => UNIT_OPTIONS, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    const priceValue = Number(form.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      return "Enter a valid price.";
    }

    const quantityValue = Number(form.quantity);
    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      return "Quantity must be a whole number.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      pushToast({
        type: "error",
        title: "Check the form",
        message: validationMessage,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("unit", form.unit || "kg");
    formData.append("price", String(form.price));
    formData.append("quantity", String(form.quantity));
    formData.append("is_available", form.is_available ? "true" : "false");

    if (form.category.trim()) {
      formData.append("category", form.category.trim());
    }

    if (form.description.trim()) {
      formData.append("description", form.description.trim());
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await api.patch(`/products/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        pushToast({
          type: "success",
          title: "Product updated",
          message: "Your listing now reflects the latest details.",
        });
      } else {
        await api.post("/products", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        pushToast({
          type: "success",
          title: "Product created",
          message: "Your product is now live in the catalogue.",
        });
      }

      navigate("/products");
    } catch (requestError) {
      console.error("Failed to save product", requestError);
      const message = requestError.response?.data?.error || "We couldn't save the product.";
      setError(message);
      pushToast({
        type: "error",
        title: "Save failed",
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-info">
            <button
              type="button"
              className="dashboard-link-button"
              onClick={() => navigate("/products")}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to catalogue
            </button>
            <h1 className="dashboard-title">
              {isEditMode ? "Update product details" : "Add a new product"}
            </h1>
            <p className="dashboard-subtitle">
              {isEditMode
                ? "Refresh prices, quantities, or imagery so buyers always see accurate information."
                : "Describe your produce clearly, set inventory, and help buyers discover it faster."}
            </p>
          </div>
        </header>

        <section className="dashboard-section">
          {error && (
            <div className="status-banner error" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="dashboard-empty">
              <span className="dashboard-spinner" aria-hidden="true" />
              <p className="dashboard-empty__subtitle">Loading product details...</p>
            </div>
          ) : (
            <div className="product-editor">
              <form onSubmit={handleSubmit} className="product-editor__form" noValidate>
                <div className="product-editor__section">
                  <p className="product-editor__legend">Product information</p>
                  <div className="product-editor__field">
                    <label htmlFor="name">Product name</label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      className="dashboard-input"
                      placeholder="e.g. Fresh kale bundles"
                      required
                    />
                  </div>
                  <div className="product-editor__field">
                    <label htmlFor="category">Category</label>
                    <input
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      className="dashboard-input"
                      placeholder="e.g. Leafy greens"
                    />
                  </div>
                  <div className="product-editor__field">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      className="dashboard-input product-editor__textarea"
                      placeholder="Share harvest notes, growing practices, or delivery timelines"
                    />
                    <p className="product-editor__hint">
                      Include buying minimums, pack sizes, or delivery lead times to set expectations.
                    </p>
                  </div>
                </div>

                <div className="product-editor__section">
                  <p className="product-editor__legend">Pricing & availability</p>
                  <div className="product-editor__field">
                    <label htmlFor="unit">Unit</label>
                    <select
                      id="unit"
                      name="unit"
                      value={form.unit}
                      onChange={handleInputChange}
                      className="dashboard-select"
                    >
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="product-editor__field">
                    <label htmlFor="price">Price</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleInputChange}
                      className="dashboard-input"
                      placeholder="e.g. 120"
                      required
                    />
                    <p className="product-editor__hint">Buyers will see this as Kenyan Shillings per selected unit.</p>
                  </div>
                  <div className="product-editor__field">
                    <label htmlFor="quantity">Available quantity</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={form.quantity}
                      onChange={handleInputChange}
                      className="dashboard-input"
                      placeholder="e.g. 40"
                      required
                    />
                  </div>
                  <label className="product-editor__switch">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={form.is_available}
                      onChange={handleCheckboxChange}
                    />
                    Make this listing visible to buyers
                  </label>
                </div>

                <div className="product-editor__actions">
                  <button
                    type="button"
                    className="dashboard-btn is-ghost"
                    onClick={() => navigate("/products")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`dashboard-btn is-primary${saving ? " is-disabled" : ""}`}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} aria-hidden="true" />
                        {isEditMode ? "Save changes" : "Publish product"}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <aside className="product-editor__aside">
                <div className="product-editor__media-card">
                  <div className="product-editor__media-preview" aria-live="polite">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" />
                    ) : (
                      <div className="dashboard-empty" style={{ border: "none", boxShadow: "none", background: "transparent", padding: "1.5rem 1rem" }}>
                        <UploadCloud size={32} aria-hidden="true" />
                        <p className="dashboard-empty__subtitle">No primary image yet</p>
                      </div>
                    )}
                  </div>
                  <label className="product-editor__upload-label">
                    <UploadCloud size={18} aria-hidden="true" />
                    {imagePreview ? "Replace image" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="product-editor__upload-input"
                    />
                  </label>
                  <p className="product-editor__hint">
                    Use clear, well-lit photos. We recommend square images at least 800 x 800 pixels.
                  </p>
                </div>
                <div className="product-editor__tips">
                  <strong>Helpful tips</strong>
                  <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem" }}>
                    <li>Confirm quantities match what you can fulfill within two days.</li>
                    <li>Describe any quality grades or certifications to build buyer trust.</li>
                    <li>Keep pricing current so wholesale buyers can plan confidently.</li>
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProductEditor;