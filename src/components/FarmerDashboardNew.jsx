import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Config.jsx';
import {
  ShoppingCart,
  Package,
  Plus,
  DollarSign,
  MapPin,
  Calendar,
  LogOut,
  ClipboardList
} from 'lucide-react';
import MapWidget from './maps/MapWidget';
import { useToast } from './common/ToastProvider.jsx';
import './Dashboard.css';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [mapOrders, setMapOrders] = useState([]);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    unit: 'kg',
    price: '',
    quantity: '',
    description: '',
    is_available: true
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    return () => {
      if (productImagePreview) {
        URL.revokeObjectURL(productImagePreview);
      }
    };
  }, [productImagePreview]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser?.role !== 'farmer') {
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (!Array.isArray(products)) {
      return;
    }

    const nextDrafts = {};
    products.forEach((product) => {
      nextDrafts[product.id] = String(product.quantity ?? 0);
    });
    setQuantityDrafts(nextDrafts);
  }, [products]);

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
      return 'On farm';
    }

    const parts = [location.city, location.region, location.country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(', ');
    }

    return location.label || 'On farm';
  };

  const formatShippingAddress = (order) => {
    const address = order?.shipping_address;
    if (!address) {
      return 'Shipping details not provided';
    }

    const parts = [address.address_line, address.city, address.region, address.country].filter(Boolean);
    if (parts.length === 0) {
      return address.label || 'Shipping details not provided';
    }

    return parts.join(', ');
  };

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

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const currentUserRaw = localStorage.getItem('user');
      let currentUserId = null;
      if (currentUserRaw) {
        try {
          currentUserId = JSON.parse(currentUserRaw)?.id ?? null;
        } catch (error) {
          console.warn('Failed to parse stored user for farmer dashboard', error);
        }
      }

      const productParams = {
        include_unavailable: true,
        per_page: 100
      };
      if (currentUserId) {
        productParams.farmer_id = currentUserId;
      }

      const productsRes = await api.get('/products', { params: productParams });
      const ownedProducts = productsRes.data?.products || [];
      setProducts(ownedProducts);

      const ordersRes = await api.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedOrders = ordersRes.data.orders || [];
      setOrders(fetchedOrders);
      setMapOrders(
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

      const totalProducts = ownedProducts.length;
      const totalOrders = fetchedOrders.length;
      const totalRevenue = fetchedOrders.reduce((sum, order) => {
        return sum + (order.payment_status === 'paid' ? Number(order.total_price || 0) : 0);
      }, 0);
      const pendingOrders = fetchedOrders.filter((order) => {
        const deliveryStatus = (order.delivery_status || '').toLowerCase();
        const paymentStatus = (order.payment_status || '').toLowerCase();
        return ['pending', 'processing', 'awaiting_fulfilment'].includes(deliveryStatus) || paymentStatus === 'pending';
      }).length;

      setStats((prev) => ({
        ...prev,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deliveryMarkers = useMemo(() => {
    if (!Array.isArray(mapOrders) || mapOrders.length === 0) {
      return [];
    }

    return mapOrders.map((order) => {
      const location = order.shipping_address;
      return {
        lat: Number(location.latitude),
        lng: Number(location.longitude),
        label: `#${order.id}`
      };
    });
  }, [mapOrders]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleProductFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview);
    }

    if (!file) {
      setProductImageFile(null);
      setProductImagePreview('');
      return;
    }

    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      alert('Product name is required.');
      return;
    }

    const priceValue = Number(productForm.price);
    const quantityValue = Number(productForm.quantity);

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      alert('Enter a valid price.');
      return;
    }

    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      alert('Quantity must be a whole number.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim() || undefined,
      unit: productForm.unit.trim() || 'kg',
      price: priceValue,
      quantity: quantityValue,
      description: productForm.description.trim() || undefined,
      is_available: productForm.is_available
    };

    setCreatingProduct(true);
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (productImageFile) {
        formData.append('image', productImageFile);
      }

      await api.post('/products', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await loadDashboardData();
      setProductForm({
        name: '',
        category: '',
        unit: 'kg',
        price: '',
        quantity: '',
        description: '',
        is_available: true
      });
      setProductImageFile(null);
      if (productImagePreview) {
        URL.revokeObjectURL(productImagePreview);
      }
      setProductImagePreview('');
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Could not create product. Please try again.');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleQuantityDraftChange = (productId, value) => {
    if (value === '' || /^[0-9]+$/.test(value)) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const handleUpdateQuantity = async (productId) => {
    const draftValue = quantityDrafts[productId];
    const nextQuantity = Number(draftValue);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      alert('Enter a valid quantity before updating.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setUpdatingProductId(productId);
    try {
      await api.patch(
        `/products/${productId}`,
        { quantity: nextQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update product quantity.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleToggleAvailability = async (productId, currentAvailability) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setUpdatingProductId(productId);
    try {
      await api.patch(
        `/products/${productId}`,
        { is_available: !currentAvailability },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert('Could not update product availability.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const resolveAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }

    return { Authorization: `Bearer ${token}` };
  };

  const closeAssignmentModal = () => {
    setAssignModalOpen(false);
    setAvailableAgents([]);
    setSelectedOrder(null);
    setAssignmentError('');
    setAgentsLoading(false);
    setAssignSubmitting(false);
  };

  const openAssignmentModal = async (order) => {
    const headers = resolveAuthHeaders();
    if (!headers) {
      return;
    }

    setSelectedOrder(order);
    setAssignModalOpen(true);
    setAssignmentError('');
    setAvailableAgents([]);
    setAgentsLoading(true);

    try {
      const response = await api.get('/api/orders/delivery-agents', { headers });
      const agents = Array.isArray(response.data?.agents) ? response.data.agents : [];
      setAvailableAgents(agents);
      if (agents.length === 0) {
        setAssignmentError('No delivery agents are currently available. Please try again soon.');
      }
    } catch (error) {
      console.error('Failed to load delivery agents', error);
      setAssignmentError('Could not load delivery agents. Please try again.');
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!selectedOrder) {
      return;
    }

    const headers = resolveAuthHeaders();
    if (!headers) {
      return;
    }

    setAssignSubmitting(true);
    setAssignmentError('');

    try {
      await api.post(
        `/api/orders/${selectedOrder.id}/assign-agent`,
        { agent_id: agentId },
        { headers }
      );
      pushToast({
        type: 'success',
        title: 'Delivery agent assigned',
        message: `Order #${selectedOrder.id} is now allocated to your delivery partner.`,
      });
      closeAssignmentModal();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to assign delivery agent', error);
      const message = error.response?.data?.error || 'Failed to assign delivery agent.';
      setAssignmentError(message);
      pushToast({ type: 'error', title: 'Assignment failed', message });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const statCards = [
    {
      id: 'products',
      label: 'Products listed',
      value: stats.totalProducts,
      icon: Package,
      accent: '#2b7a4b'
    },
    {
      id: 'orders',
      label: 'Orders received',
      value: stats.totalOrders,
      icon: ShoppingCart,
      accent: '#1a5bb8'
    },
    {
      id: 'revenue',
      label: 'Revenue collected',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      accent: '#1d8248'
    },
    {
      id: 'pending-orders',
      label: 'Orders awaiting fulfilment',
      value: stats.pendingOrders,
      icon: ClipboardList,
      accent: '#b25c00'
    }
  ];

  const sortedProducts = [...products].sort((a, b) => {
    const left = new Date(a?.updated_at || a?.created_at || 0).getTime();
    const right = new Date(b?.updated_at || b?.created_at || 0).getTime();
    return right - left;
  });
  const availableProductsCount = sortedProducts.filter((product) => product.is_available).length;
  const pausedProductsCount = Math.max(sortedProducts.length - availableProductsCount, 0);
  const isCreateDisabled =
    creatingProduct ||
    !productForm.name.trim() ||
    productForm.price === '' ||
    productForm.quantity === '';
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-content">
          <section className="dashboard-section dashboard-full-height">
            <div className="dashboard-empty">
              <span className="dashboard-spinner" aria-hidden="true" />
              <p className="dashboard-empty__subtitle">Preparing farm overview...</p>
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
              {user?.name ? `Good morning, ${user.name.split(' ')[0]}!` : 'Farmer dashboard'}
            </h1>
            <p className="dashboard-subtitle">
              Monitor inventory, fulfil orders, and keep track of deliveries without leaving your farm.
            </p>
          </div>
          <div className="dashboard-actions">
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-primary"
                onClick={() => navigate('/products/new')}
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
            <div className="dashboard-btn-wrapper">
              <button
                type="button"
                className="dashboard-btn is-outline"
                onClick={() => navigate('/products')}
              >
                <Package size={18} />
                Manage Catalogue
              </button>
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
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Today at a glance</h2>
          </div>
          <div className="dashboard-section__body">
            <div className="dashboard-grid dashboard-grid--stats">
              {statCards.map((stat) => (
                <div key={stat.id} className="dashboard-stat">
                  <span
                    className="dashboard-stat__icon"
                    style={{
                      color: stat.accent,
                      background: `${stat.accent}1a`
                    }}
                  >
                    <stat.icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="dashboard-stat__label">{stat.label}</p>
                    <p className="dashboard-stat__value">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div
          className="dashboard-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}
        >
          <section className="dashboard-section">
            <div className="dashboard-section__header catalog-header">
              <div className="catalog-header-text">
                <h2 className="dashboard-section__title">Your products</h2>
                <p className="catalog-header-caption">
                  Keep your catalogue up to date with stock levels and availability.
                </p>
              </div>
              <div className="catalog-header-controls">
                <div className="catalog-header-meta">
                  <span className="catalog-status is-available">{availableProductsCount} active</span>
                  {pausedProductsCount > 0 && (
                    <span className="catalog-status is-unavailable">
                      {pausedProductsCount} paused
                    </span>
                  )}
                </div>
                <div className="dashboard-btn-wrapper">
                  <button
                    type="button"
                    className="dashboard-btn is-outline"
                    onClick={() => navigate('/products')}
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
            <div className="dashboard-section__body">
              <form className="catalog-form" onSubmit={handleCreateProduct}>
                <div className="catalog-form__grid">
                  <label className="catalog-field">
                    <span className="catalog-field__label">Product name *</span>
                    <input
                      type="text"
                      name="name"
                      className="catalog-input"
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      required
                    />
                  </label>
                  <label className="catalog-field">
                    <span className="catalog-field__label">Category</span>
                    <input
                      type="text"
                      name="category"
                      className="catalog-input"
                      value={productForm.category}
                      onChange={handleProductFormChange}
                      placeholder="e.g. Vegetables"
                    />
                  </label>
                  <label className="catalog-field">
                    <span className="catalog-field__label">Unit</span>
                    <input
                      type="text"
                      name="unit"
                      className="catalog-input"
                      value={productForm.unit}
                      onChange={handleProductFormChange}
                    />
                  </label>
                  <label className="catalog-field">
                    <span className="catalog-field__label">Price (KSh) *</span>
                    <input
                      type="number"
                      name="price"
                      className="catalog-input"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </label>
                  <label className="catalog-field">
                    <span className="catalog-field__label">Quantity *</span>
                    <input
                      type="number"
                      name="quantity"
                      className="catalog-input"
                      value={productForm.quantity}
                      onChange={handleProductFormChange}
                      min="0"
                      step="1"
                      required
                    />
                  </label>
                  <label className="catalog-field catalog-field--wide">
                    <span className="catalog-field__label">Primary product image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="catalog-input"
                      onChange={handleProductImageChange}
                    />
                    {productImagePreview && (
                      <img
                        src={productImagePreview}
                        alt="New product preview"
                        className="catalog-image-preview"
                      />
                    )}
                  </label>
                  <label className="catalog-field catalog-field--wide">
                    <span className="catalog-field__label">Description</span>
                    <textarea
                      name="description"
                      className="catalog-textarea"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      rows={3}
                      placeholder="Add notes about freshness, variety, or delivery schedule"
                    />
                  </label>
                </div>
                <div className="catalog-form__actions">
                  <label className="catalog-checkbox">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={productForm.is_available}
                      onChange={handleProductFormChange}
                    />
                    <span>Available for sale immediately</span>
                  </label>
                  <button
                    type="submit"
                    className={`dashboard-btn is-primary${isCreateDisabled ? ' is-disabled' : ''}`}
                    disabled={isCreateDisabled}
                  >
                    {creatingProduct ? 'Saving...' : 'Save product'}
                  </button>
                </div>
              </form>

              {sortedProducts.length === 0 ? (
                <div className="dashboard-empty">
                  <Package size={40} aria-hidden="true" />
                  <p className="dashboard-empty__title">You have not listed any products yet</p>
                  <p className="dashboard-empty__subtitle">
                    Get started by adding your produce to the marketplace.
                  </p>
                </div>
              ) : (
                <>
                  <p className="catalog-hint">Recently updated products appear first.</p>
                  <div className="dashboard-list">
                    {sortedProducts.map((product) => {
                      const draftQuantity = quantityDrafts[product.id] ?? '';
                      const parsedQuantity = Number(draftQuantity);
                      const isUpdating = updatingProductId === product.id;
                      const disableQuantityUpdate =
                        draftQuantity === '' ||
                        !Number.isInteger(parsedQuantity) ||
                        parsedQuantity === product.quantity ||
                        isUpdating;

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
                                <span>{formatCurrency(product.price)} per {product.unit}</span>
                              </div>
                              <div className="dashboard-meta-row catalog-meta-row">
                                <MapPin size={14} aria-hidden="true" />
                                <span>{formatLocation(product)}</span>
                              </div>
                              <div className="catalog-status-row">
                                <span className={`catalog-status ${product.is_available ? 'is-available' : 'is-unavailable'}`}>
                                  {product.is_available ? 'Available' : 'Paused'}
                                </span>
                                <span className="dashboard-pill">{product.quantity} in stock</span>
                              </div>
                            </div>
                          </div>
                          <div className="catalog-inline-actions">
                            <div className="catalog-quantity-control">
                              <label className="catalog-quantity-label" htmlFor={`quantity-${product.id}`}>Qty</label>
                              <input
                                id={`quantity-${product.id}`}
                                type="text"
                                inputMode="numeric"
                                className="catalog-number-input"
                                value={draftQuantity}
                                onChange={(event) => handleQuantityDraftChange(product.id, event.target.value)}
                              />
                              <button
                                type="button"
                                className={`catalog-secondary-button${disableQuantityUpdate ? ' is-disabled' : ''}`}
                                onClick={() => handleUpdateQuantity(product.id)}
                                disabled={disableQuantityUpdate}
                              >
                                {isUpdating && !disableQuantityUpdate ? 'Updating...' : 'Update'}
                              </button>
                            </div>
                            <button
                              type="button"
                              className={`catalog-secondary-button${isUpdating ? ' is-disabled' : ''}`}
                              onClick={() => handleToggleAvailability(product.id, product.is_available)}
                              disabled={isUpdating}
                            >
                              {product.is_available ? 'Pause sales' : 'Mark available'}
                            </button>
                            <div className="dashboard-actions-row">
                              <button
                                type="button"
                                className="dashboard-link-button"
                                onClick={() => navigate(`/products/${product.id}/edit`)}
                                aria-label="Edit product"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="dashboard-link-button dashboard-danger"
                                onClick={() => handleDeleteProduct(product.id)}
                                aria-label="Delete product"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h2 className="dashboard-section__title">Recent orders</h2>
            </div>
            <div className="dashboard-section__body">
              {recentOrders.length === 0 ? (
                <div className="dashboard-empty">
                  <ShoppingCart size={40} aria-hidden="true" />
                  <p className="dashboard-empty__title">No orders yet</p>
                  <p className="dashboard-empty__subtitle">
                    Orders that come in will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="dashboard-list">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="dashboard-list-item">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <div className="dashboard-meta-row">
                          <Calendar size={14} aria-hidden="true" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="dashboard-meta-row">
                          <Package size={14} aria-hidden="true" />
                          <span>{order.items?.length || 0} items</span>
                        </div>
                        <div className="dashboard-meta-row">
                          <MapPin size={14} aria-hidden="true" />
                          <span>{formatShippingAddress(order)}</span>
                        </div>
                      </div>
                      <div className="dashboard-actions-column">
                        <span className="dashboard-pill">{formatCurrency(order.total_price)}</span>
                        <span className={statusClassName(order.delivery_status || order.payment_status)}>
                          {humanizeStatus(order.delivery_status || order.payment_status)}
                        </span>
                        {order.delivery_agent_id ? (
                          <span className="dashboard-assignee">Delivery agent assigned</span>
                        ) : (
                          <button
                            type="button"
                            className="dashboard-link-button"
                            onClick={() => openAssignmentModal(order)}
                            disabled={assignSubmitting && selectedOrder?.id === order.id}
                          >
                            Assign delivery
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {deliveryMarkers.length > 0 && (
          <MapWidget
            className="dashboard-section"
            title="Recent deliveries"
            subtitle="Fulfilled orders with a delivery address"
            markers={deliveryMarkers}
          />
        )}

        {assignModalOpen && (
          <div
            className="dashboard-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
          >
            <div className="dashboard-modal">
              <div className="dashboard-modal__header">
                <h3 id="assign-modal-title">Assign delivery agent</h3>
                <p>
                  Choose who should fulfil order #{selectedOrder?.id}. Only agents marked as available appear here.
                </p>
              </div>

              {assignmentError && (
                <div className="dashboard-modal__banner dashboard-modal__banner--error" role="alert">
                  {assignmentError}
                </div>
              )}

              {agentsLoading ? (
                <div className="dashboard-modal__loading">
                  <span className="dashboard-spinner" aria-hidden="true" />
                  <p>Loading delivery partners…</p>
                </div>
              ) : availableAgents.length === 0 ? (
                <div className="dashboard-modal__empty">
                  <Package size={28} aria-hidden="true" />
                  <p>No delivery agents are available right now.</p>
                </div>
              ) : (
                <ul className="dashboard-modal__list">
                  {availableAgents.map((agent) => (
                    <li key={agent.id}>
                      <button
                        type="button"
                        className="dashboard-modal__option"
                        onClick={() => handleAssignAgent(agent.id)}
                        disabled={assignSubmitting || agent.is_available === false}
                      >
                        <div className="dashboard-modal__option-body">
                          <strong>{agent.name}</strong>
                          {agent.phone && <span>{agent.phone}</span>}
                          {agent.vehicle_type && <span>{agent.vehicle_type}</span>}
                        </div>
                        <span className={`dashboard-chip ${agent.is_available ? 'is-success' : 'is-muted'}`}>
                          {agent.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="dashboard-modal__footer">
                <button
                  type="button"
                  className="dashboard-btn is-ghost"
                  onClick={closeAssignmentModal}
                  disabled={assignSubmitting}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default FarmerDashboard;