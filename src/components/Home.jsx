import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api } from "../Config.jsx";
import { useCart } from "./cart/CartContext";
import { useToast } from "./common/ToastProvider.jsx";
import handshake from "../assets/handshake.png";
import greenarrow from "../assets/greenarrow.png";
import userimage from "../assets/userimage.png";
import cart from "../assets/cart.png";
import lorry from "../assets/lorry.png";
import "./Home.css";

const roleRoutes = {
  farmer: "/farmer-dashboard",
  buyer: "/buyer-dashboard",
  delivery_agent: "/delivery-dashboard",
};

const Home = () => {
  const navigate = useNavigate();
  const [marketProducts, setMarketProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const { addItem } = useCart();
  const { pushToast } = useToast();

  const getStoredUser = () => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Failed to parse stored user", error);
      return null;
    }
  };

  const formatCurrency = (value, unit) => {
    const amount = Number(value || 0).toLocaleString();
    return unit ? `KSh ${amount} / ${unit}` : `KSh ${amount}`;
  };

  const formatLocation = (product) => {
    const location = product?.location;
    if (!location) {
      return "Across Kenya";
    }

    const parts = [location.city, location.region, location.country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }

    return location.label || "Across Kenya";
  };

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get("/products", { params: { per_page: 8 } });
        setMarketProducts(response.data?.products || []);
      } catch (error) {
        console.error("Failed to load featured produce", error);
        setCatalogError("Unable to load featured produce right now.");
      } finally {
        setCatalogLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const token = localStorage.getItem("token");
  const sessionUser = getStoredUser();
  const isAuthenticated = Boolean(token && sessionUser);

  const handleAddToCart = (product) => {
    if (!product) return;

    setAddingProductId(product.id);

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      farmerId: product.farmer_id,
      unit: product.unit,
      image: product.primary_image || product.image_uri,
    });

    pushToast({
      type: "success",
      title: "Added to cart",
      message: `${product.name} is now in your basket.`,
    });

    window.setTimeout(() => setAddingProductId(null), 500);
  };

  const handleCheckoutRedirect = () => {
    const user = getStoredUser();
    const tokenFromStorage = localStorage.getItem("token");

    if (!tokenFromStorage || !user) {
      navigate("/login", { state: { redirectTo: "/checkout" } });
      return;
    }

    navigate("/checkout");
  };

  const handleCartRedirect = () => {
    const user = getStoredUser();
    const tokenFromStorage = localStorage.getItem("token");

    if (!tokenFromStorage || !user) {
      navigate("/login", { state: { redirectTo: "/carts" } });
      return;
    }

    navigate("/carts");
  };

  const handleRedirect = (role) => {
    const targetRoute = roleRoutes[role];
    if (!targetRoute) {
      navigate('/login');
      return;
    }

    const userFromStorage = getStoredUser();
    if (!userFromStorage) {
      pushToast({
        type: "info",
        title: "Sign in required",
        message: "Please log in to access this dashboard.",
      });
      navigate("/login");
      return;
    }

    const userRole = userFromStorage?.role;
    const userRoute = userRole ? roleRoutes[userRole] : null;

    if (userRoute && userRoute === targetRoute) {
      navigate(targetRoute);
      return;
    }

    const readableRole = userRole ? userRole.replace(/_/g, " ") : "visitor";
    pushToast({
      type: "error",
      title: "Access denied",
      message: `You are signed in as ${readableRole}.`,
    });
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-text">
          <h3 className="hero-kicker">Connecting farmers to the Market</h3>
          <h1>
            From farm <span className="highlight">to table</span>, delivered with trust
          </h1>
          <p className="hero-subtitle">
            AgroLink bridges the gap between smallholder farmers and buyers, eliminating middle men.
          </p>
          {!isAuthenticated && (
            <div className="hero-buttons">
              <button type="button" className="btn-green" onClick={() => navigate("/register", { state: { role: "farmer" } })}>
                Join as Farmer
              </button>
              <button type="button" className="btn-outline" onClick={() => navigate("/register", { state: { role: "buyer" } })}>
                Join as Buyer
              </button>
            </div>
          )}
        </div>
        <div className="hero-arrow" aria-hidden="true">
          <img src={greenarrow} alt="" />
        </div>
        <div className="hero-image">
          <img src={handshake} alt="Handshake" className="handshake-img" />
        </div>
      </section>

      <section className="how-section" id="how">
        <h2>How it works</h2>
        <p className="how-subtitle">
          Choose the experience tailored to your role i.e farmers, buyers sourcing fresh goods, and delivery teams fulfilling last-mile logistics.
        </p>

        <div className="how-grid">
          <button type="button" className="how-card" onClick={() => handleRedirect("farmer")}>
            <img src={userimage} alt="Farmer" />
            <h3>Farmer Dashboard</h3>
            <p>Manage inventory, monitor orders, and track delivery destinations with live analytics.</p>
          </button>
          <button type="button" className="how-card" onClick={() => handleRedirect("buyer")}>
            <img src={cart} alt="Buyer" />
            <h3>Buyer Dashboard</h3>
            <p>Explore verified farmers, streamline orders, and visualize delivery logistics.</p>
          </button>
          <button type="button" className="how-card" onClick={() => handleRedirect("delivery_agent")}>
            <img src={lorry} alt="Delivery" />
            <h3>Delivery Dashboard</h3>
            <p>Coordinate drop-offs, assign drivers, and monitor progression on intuitive maps.</p>
          </button>
        </div>
      </section>

      <section className="market-section" id="marketplace">
        <div className="market-header">
          <div>
            <h2>Fresh from our farmers</h2>
            <p className="market-subtitle">
              Discover seasonal produce grown by trusted smallholder farmers across Kenya.
            </p>
          </div>
          <div className="market-actions">
            <button type="button" className="market-button" onClick={handleCheckoutRedirect}>
              Go to checkout
            </button>
          </div>
        </div>

        {catalogLoading ? (
          <div className="market-placeholder">Loading featured produce...</div>
        ) : catalogError ? (
          <div className="market-placeholder">{catalogError}</div>
        ) : marketProducts.length === 0 ? (
          <div className="market-placeholder">New produce will appear here soon.</div>
        ) : (
          <div className="market-grid">
            {marketProducts.map((product) => (
              <article key={product.id} className="market-card">
                {product.primary_image && (
                  <div className="market-card__media">
                    <img src={product.primary_image} alt={product.name} loading="lazy" />
                  </div>
                )}
                <div className="market-card__body">
                  <div className="market-card__header">
                    <h3>{product.name}</h3>
                    <span className="market-price">{formatCurrency(product.price, product.unit)}</span>
                  </div>
                  {product.description && (
                    <p className="market-description">{product.description}</p>
                  )}
                  <div className="market-meta">
                    <span className="market-stock">{product.quantity} in stock</span>
                    <span className="market-location">
                      <MapPin size={14} aria-hidden="true" />
                      {formatLocation(product)}
                    </span>
                  </div>
                  <div className="market-card__footer">
                    <button
                      type="button"
                      className="market-cta"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingProductId === product.id}
                    >
                      {addingProductId === product.id ? "Added" : "Add to cart"}
                    </button>
                    <button type="button" className="market-secondary" onClick={handleCheckoutRedirect}>
                      View cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="footer-text">© 2025 AgroLink. Connecting farmers and buyers seamlessly.</footer>
    </div>
  );
};

export default Home;