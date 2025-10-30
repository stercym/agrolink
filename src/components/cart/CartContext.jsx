import React, {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,} from "react";
import { api } from "../../Config.jsx";
import { useToast } from "../common/ToastProvider.jsx";

const STORAGE_KEY = "agrolink-cart";

const CartContext = createContext(null);

const initialState = { items: [] };

function normaliseItem(payload) {
  return {
    id: payload.id,
    name: payload.name,
    price: Number(payload.price) || 0,
    quantity: Math.max(1, Number(payload.quantity) || 1),
    farmerId: payload.farmerId || null,
    unit: payload.unit || "kg",
    image: payload.image || null,
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      return { items: action.payload.items || [] };
    }
    case "add": {
      const incoming = normaliseItem(action.payload);
      const existingIndex = state.items.findIndex((item) => item.id === incoming.id);

      if (existingIndex !== -1) {
        const nextItems = state.items.map((item, index) => {
          if (index !== existingIndex) return item;
          const nextQuantity = (Number(item.quantity) || 0) + (Number(incoming.quantity) || 1);
          return { ...item, quantity: Math.max(1, nextQuantity) };
        });
        return { items: nextItems };
      }

      return { items: [...state.items, incoming] };
    }
    case "updateQuantity": {
      const { id, quantity } = action.payload;
      const safeQuantity = Math.max(1, Number(quantity) || 1);
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: safeQuantity } : item
        ),
      };
    }
    case "remove": {
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    }
    case "clear": {
      return { items: [] };
    }
    default:
      return state;
  }
}

function readCartFromStorage() {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed.items)) {
      return {
        items: parsed.items.map(normaliseItem),
      };
    }
    return initialState;
  } catch (error) {
    console.warn("Failed to read cart from storage", error);
    return initialState;
  }
}

function mapServerItemToLocal(item) {
  const product = item.product || {};
  return normaliseItem({
    id: item.product_id,
    name: product.name || "Product",
    price: product.price || 0,
    quantity: item.quantity,
    farmerId: product.farmer_id || null,
    unit: product.unit || product.default_unit || "kg",
    image: product.primary_image || product.image_uri || null,
  });
}

function extractAuth() {
  if (typeof window === "undefined") {
    return { token: null, role: null };
  }

  const token = window.localStorage.getItem("token");
  const rawUser = window.localStorage.getItem("user");

  if (!rawUser) {
    return { token, role: null };
  }

  try {
    const parsed = JSON.parse(rawUser);
    return { token, role: parsed?.role || null };
  } catch (error) {
    console.warn("Failed to parse stored user", error);
    return { token, role: null };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, readCartFromStorage);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const skipSyncRef = useRef(true);
  const fetchedServerRef = useRef(false);
  const lastToastMessageRef = useRef(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: state.items })
      );
    } catch (error) {
      console.warn("Failed to persist cart", error);
    }
  }, [state.items]);

  const mapForServer = useCallback(
    (items) =>
      items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    []
  );

  const syncToServer = useCallback(
    async (overrideItems) => {
      const { token, role } = extractAuth();
      if (!token || role !== "buyer") {
        setLastSyncError(null);
        lastToastMessageRef.current = null;
        return { success: false, skipped: true };
      }

      const payloadItems = overrideItems || state.items;

      setIsSyncing(true);
      try {
        await api.put(
          "/api/cart",
          { items: mapForServer(payloadItems) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLastSyncError(null);
        lastToastMessageRef.current = null;
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || "We could not sync your cart.";
        setLastSyncError(message);
        if (lastToastMessageRef.current !== message) {
          pushToast({ type: "error", title: "Cart sync failed", message });
          lastToastMessageRef.current = message;
        }
        return { success: false, error: message };
      } finally {
        setIsSyncing(false);
      }
    },
    [mapForServer, pushToast, state.items]
  );

  const loadServerCart = useCallback(async () => {
    const { token, role } = extractAuth();
    if (!token || role !== "buyer") {
      return;
    }

    if (fetchedServerRef.current) {
      return;
    }

    fetchedServerRef.current = true;
    setIsSyncing(true);

    try {
      const response = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const serverItems = (response.data?.cart?.items || []).map(mapServerItemToLocal);

      if (serverItems.length) {
        skipSyncRef.current = true;
        dispatch({ type: "hydrate", payload: { items: serverItems } });
      } else if (state.items.length) {
        await syncToServer(state.items);
      }
    } catch (error) {
      console.warn("Failed to fetch server cart", error);
    } finally {
      setIsSyncing(false);
    }
  }, [state.items, syncToServer]);

  useEffect(() => {
    loadServerCart();
  }, [loadServerCart]);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    syncToServer();
  }, [state.items, syncToServer]);

  const total = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      total,
      itemCount,
      isSyncing,
      lastSyncError,
      addItem: (item) => {
        skipSyncRef.current = false;
        dispatch({ type: "add", payload: item });
      },
      removeItem: (id) => {
        skipSyncRef.current = false;
        dispatch({ type: "remove", payload: { id } });
      },
      updateQuantity: (id, quantity) => {
        skipSyncRef.current = false;
        dispatch({ type: "updateQuantity", payload: { id, quantity } });
      },
      clearCart: () => {
        skipSyncRef.current = false;
        dispatch({ type: "clear" });
      },
      hydrateCart: (items) => {
        skipSyncRef.current = true;
        dispatch({ type: "hydrate", payload: { items } });
      },
      syncToServer,
      refreshFromServer: loadServerCart,
    }),
    [isSyncing, lastSyncError, loadServerCart, state.items, syncToServer, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}