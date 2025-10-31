import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../Config.jsx";
import OrderTracking from "./OrderTracking.jsx";
import styles from "./Order.module.css";

const formatCurrency = (value) => {
	if (value === null || value === undefined) {
		return "—";
	}

	try {
		return new Intl.NumberFormat("en-KE", {
			style: "currency",
			currency: "KES",
			maximumFractionDigits: 2,
		}).format(Number(value));
	} catch {
		return `KSh ${Number(value).toFixed(2)}`;
	}
};

const formatDateTime = (value) => {
	if (!value) {
		return "—";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatAddress = (address) => {
	if (!address) {
		return "—";
	}

	const parts = [
		address.label,
		address.address_line,
		address.city,
		address.region,
		address.country,
	].filter(Boolean);

	return parts.length > 0 ? parts.join(", ") : "—";
};

const getStatusChipClass = (baseClass, accentClass, shouldAccent) =>
	shouldAccent ? `${baseClass} ${accentClass}`.trim() : baseClass;

export default function OrderDetailsPage({ orderId: providedOrderId }) {
	const params = useParams();
	const derivedOrderId = providedOrderId ?? params?.orderId;
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!derivedOrderId) {
			return;
		}

		let isMounted = true;
		const fetchOrder = async () => {
			setLoading(true);
			setError("");

			try {
				const { data } = await api.get(`/api/orders/${derivedOrderId}`);
				if (!isMounted) {
					return;
				}

				setOrder(data?.order ?? null);
			} catch (err) {
				if (!isMounted) {
					return;
				}

				const message = err?.response?.data?.error || err?.message || "Failed to load order";
				setError(message);
				setOrder(null);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		fetchOrder();

		return () => {
			isMounted = false;
		};
	}, [derivedOrderId]);

	const pickupLocation = useMemo(() => {
		if (!order?.items) {
			return null;
		}

		for (const item of order.items) {
			if (item?.product?.location) {
				return item.product.location;
			}
		}

		return null;
	}, [order]);

	if (!derivedOrderId) {
		return (
			<div className={styles.detailsFallback}>
				<p>Supply an order ID to view the details.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className={styles.detailsFallback}>
				<p>Loading order #{derivedOrderId}…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.detailsFallback}>
				<p role="alert">{error}</p>
				<p>Please refresh or return to your orders list.</p>
			</div>
		);
	}

	if (!order) {
		return (
			<div className={styles.detailsFallback}>
				<p>No information found for order #{derivedOrderId}.</p>
			</div>
		);
	}

	const shippingAddress = order.shipping_address;
	const items = Array.isArray(order.items) ? order.items : [];

	const deliveryStatus = order.delivery_status || "processing";
	const paymentStatus = order.payment_status || "pending";
	const orderStatus = order.status || "placed";

	return (
		<div className={styles.details}>
			<div className={styles.detailsHeader}>
				<div>
					<h2>Order #{order.id}</h2>
					<p className={styles.metaLine}>
						Placed {formatDateTime(order.placed_at)} · Last updated {formatDateTime(order.updated_at)}
					</p>
				</div>
				<div className={styles.statusGroup}>
					<span
						className={getStatusChipClass(
							styles.statusPill,
							styles.statusPillAccent,
							paymentStatus === "paid"
						)}
					>
						Payment: {paymentStatus.toLowerCase()}
					</span>
								<span
									className={getStatusChipClass(
										styles.statusPill,
										styles.statusPillAccent,
										["delivered", "out_for_delivery"].includes(deliveryStatus.toLowerCase())
									)}
								>
									Delivery: {deliveryStatus.toLowerCase().split("_").join(" ")}
					</span>
					<span className={styles.statusPill}>Status: {orderStatus.toLowerCase()}</span>
				</div>
			</div>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<h3 className={styles.sectionTitle}>Order overview</h3>
					<Link className={styles.ghostLink} to="/orders">
						Back to orders
					</Link>
				</div>
				<div className={styles.metricsGrid}>
					<div className={styles.metric}>
						<span className={styles.metricLabel}>Items total</span>
						<span className={styles.metricValue}>{formatCurrency(order.total_items_amount)}</span>
					</div>
					<div className={styles.metric}>
						<span className={styles.metricLabel}>Delivery fee</span>
						<span className={styles.metricValue}>{formatCurrency(order.delivery_cost)}</span>
					</div>
					<div className={styles.metric}>
						<span className={styles.metricLabel}>Grand total</span>
						<span className={styles.metricValue}>{formatCurrency(order.total_price)}</span>
					</div>
					<div className={styles.metric}>
						<span className={styles.metricLabel}>Delivery group</span>
						<span className={styles.metricValue}>{order.delivery_group_id ?? "—"}</span>
					</div>
				</div>
				<OrderTracking status={deliveryStatus} />
			</section>

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Delivery information</h3>
				<div className={styles.addressGrid}>
					<div>
						<h4 className={styles.subTitle}>Shipping to</h4>
						<p className={styles.addressBlock}>{formatAddress(shippingAddress)}</p>
					</div>
					<div>
						<h4 className={styles.subTitle}>Pickup from</h4>
						<p className={styles.addressBlock}>{formatAddress(pickupLocation)}</p>
					</div>
				</div>
			</section>

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Line items</h3>
				{items.length === 0 ? (
					<p className={styles.metaLine}>No items recorded for this order.</p>
				) : (
					<div className={styles.itemsTable}>
						<div className={`${styles.itemsRow} ${styles.itemsHeader}`}>
							<span>Product</span>
							<span>Qty</span>
							<span>Unit price</span>
							<span>Subtotal</span>
						</div>
						{items.map((item) => {
							const subtotal = Number(item.quantity || 0) * Number(item.price_at_purchase || 0);
							const productName = item?.product?.name || `Product #${item.product_id}`;

							return (
								<div key={`${item.id ?? item.product_id}`} className={styles.itemsRow}>
									<span>{productName}</span>
									<span>{item.quantity ?? "—"}</span>
									<span>{formatCurrency(item.price_at_purchase)}</span>
									<span>{formatCurrency(subtotal)}</span>
								</div>
							);
						})}
					</div>
				)}
			</section>

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Meta</h3>
				<div className={styles.metaGrid}>
					<div>
						<span className={styles.metricLabel}>Buyer ID</span>
						<p className={styles.metaValue}>{order.buyer_id ?? "—"}</p>
					</div>
					<div>
						<span className={styles.metricLabel}>Farmer ID</span>
						<p className={styles.metaValue}>{order.farmer_id ?? "—"}</p>
					</div>
					<div>
						<span className={styles.metricLabel}>Delivery agent ID</span>
						<p className={styles.metaValue}>{order.delivery_agent_id ?? "—"}</p>
					</div>
					<div>
						<span className={styles.metricLabel}>Shipping address ID</span>
						<p className={styles.metaValue}>{order.shipping_address_id ?? "—"}</p>
					</div>
				</div>
			</section>
		</div>
	);
}