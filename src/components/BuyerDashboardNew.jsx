import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Config.jsx';
import {
  ShoppingCart,
  Package,
  Search,
  Heart,
  MapPin,
  Clock,
  LogOut
} from 'lucide-react';
import MapWidget from './maps/MapWidget';
import './Dashboard.css';

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Cereals', 'Herbs', 'Other'];

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mapEnabledOrders, setMapEnabledOrders] = useState([]);

  const statusClassName = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pill is-pending';
      case 'processing':
        return 'status-pill is-processing';
      case 'paid':
      case 'delivered':
        return 'status-pill is-paid';
      default:
        return 'status-pill is-default';
    }
  };

  const humanizeStatus = (status) => {
    if (!status) {
      return 'pending';
    }

    return status.replace(/_/g, ' ');
  };

  const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;
  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString();
    } catch (error) {
      return value;
    }
  };

  const formatLocation = (product) => {
    const location = product?.location;
    if (!location) {
      return 'Local farm';
    }

    const parts = [location.city, location.region, location.country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(', ');
    }

    return location.label || 'Local farm';
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser?.role !== 'buyer') {
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const productsRes = await api.get('/products');
      setProducts(productsRes.data.products || []);

      try {
        const cartRes = await api.get('/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(cartRes.data || null);
      } catch (error) {
        console.warn('Failed to load cart', error);
        setCart(null);
      }

      try {
        const ordersRes = await api.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedOrders = ordersRes.data.orders || [];
        setOrders(fetchedOrders);
        setMapEnabledOrders(
          fetchedOrders.filter((order) => {
            const location = order.shipping_address;
            if (!location) {
              return false;
            }

            const lat = Number(location.latitude);
            const lng = Number(location.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
        );
      } catch (error) {
        console.warn('Failed to load orders', error);
        setOrders([]);
        setMapEnabledOrders([]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/cart',
        { product_id: productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadDashboardData();
      alert('Product added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add product to cart');
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = product.name || '';
    const description = product.description || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.is_available;
  });

  const mapMarkers = useMemo(() => {
    if (!Array.isArray(mapEnabledOrders) || mapEnabledOrders.length === 0) {
      return [];
    }

    return mapEnabledOrders.map((order) => {
      const location = order.shipping_address;
      return {
        lat: Number(location.latitude),
        lng: Number(location.longitude),
        label: `#${order.id}`
      };
    });
  }, [mapEnabledOrders]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cartItemCount = cart?.items?.length ?? cart?.cart_items?.length ?? 0;
  const topOrders = orders.slice(0, 4);
  const featuredProducts = filteredProducts.slice(0, 8);

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-content">
          <section className="dashboard-section dashboard-full-height">
            <div className="dashboard-empty">
              <span className="dashboard-spinner" aria-hidden="true" />
              <p className="dashboard-empty__subtitle">Loading marketplace...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-info">
            <h1 className="dashboard-title">
              {user?.name ? `Hello, ${user.name.split(' ')[0]}!` : 'Hello there!'}
            </h1>
            <p className="dashboard-subtitle">
              Track your orders, discover new produce, and restock your pantry with locally sourced goods.
            </p>
          </div>
          <div className="dashboard-actions">
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-outline"
                onClick={() => navigate('/orders')}
              >
                <Package size={18} />
                View Orders
              </button>
            </div>
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-primary"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart size={18} />
                View Cart
              </button>
              {cartItemCount > 0 && <span className="counter-badge">{cartItemCount}</span>}
            </div>
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-ghost"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="dashboard-section">
          <div className="dashboard-section__body">
            <div className="dashboard-search">
              <div className="dashboard-search__input">
                <Search className="dashboard-input-icon" size={18} aria-hidden="true" />
                <input
                  type="search"
                  className="dashboard-input"
                  placeholder="Search for fresh produce..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <select
                className="dashboard-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Recommended for you</h2>
            <div className="dashboard-actions">
              <div className="dashboard-btn-wrapper">
                <button
                  type="button"
                  className="dashboard-btn is-outline"
                  onClick={() => navigate('/products')}
                >
                  Browse Marketplace
                </button>
              </div>
            </div>
          </div>
          <div className="dashboard-section__body">
            {featuredProducts.length === 0 ? (
              <div className="dashboard-empty">
                <Heart size={40} aria-hidden="true" />
                <p className="dashboard-empty__title">No products match your filters</p>
                <p className="dashboard-empty__subtitle">
                  Try adjusting your search or check back soon for new arrivals.
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {featuredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    {product.primary_image && (
                      <div className="product-card__media">
                        <img src={product.primary_image} alt={product.name} loading="lazy" />
                      </div>
                    )}
                    <div className="product-card__body">
                      <div className="product-card__title">
                        <h3>{product.name}</h3>
                        <button
                          type="button"
                          className="product-card__favorite"
                          aria-label="Save to favorites"
                        >
                          <Heart size={16} aria-hidden="true" />
                        </button>
                      </div>
                      {product.description && (
                        <p className="product-card__description">{product.description}</p>
                      )}
                      <div className="product-card__meta">
                        <strong>{formatCurrency(product.price)}</strong>
                        <span>{product.quantity} {product.unit}</span>
                      </div>
                      <div className="product-card__tags">
                        <span className="pill">
                          <MapPin size={14} aria-hidden="true" />
                          {formatLocation(product)}
                        </span>
                        <span>{product.category || 'Produce'}</span>
                      </div>
                      <div className="product-card__footer">
                        <button
                          type="button"
                          className="product-card__action"
                          onClick={() => addToCart(product.id)}
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Recent orders</h2>
          </div>
          <div className="dashboard-section__body">
            {topOrders.length === 0 ? (
              <div className="dashboard-empty">
                <ShoppingCart size={40} aria-hidden="true" />
                <p className="dashboard-empty__title">No orders yet</p>
                <p className="dashboard-empty__subtitle">
                  Once you place an order, you can monitor its progress here.
                </p>
              </div>
            ) : (
              <div className="order-cards">
                {topOrders.map((order) => (
                  <article key={order.id} className="order-card">
                    <div className="order-card__header">
                      <h3>Order #{order.id}</h3>
                      <span className={statusClassName(order.delivery_status || order.payment_status)}>
                        {humanizeStatus(order.delivery_status || order.payment_status)}
                      </span>
                    </div>
                    <div className="dashboard-meta-row">
                      <Clock size={14} aria-hidden="true" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <div className="dashboard-meta-row">
                      <Package size={14} aria-hidden="true" />
                      <span>{order.items?.length || 0} items</span>
                    </div>
                    <div className="dashboard-meta-row">
                      <strong>{formatCurrency(order.total_price)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {mapMarkers.length > 0 && (
          <MapWidget
            className="dashboard-section"
            title="Deliveries near you"
            subtitle="Recent orders with location data"
            markers={mapMarkers}
          />
        )}
      </div>
    </main>
  );
};

export default BuyerDashboard;