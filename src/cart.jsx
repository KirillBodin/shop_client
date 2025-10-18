// src/cart.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const LS_KEY = "cart";

export function CartProvider({ children }) {
  // [{ id, name, price, quantity }]
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  function add(product, qty = 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === product.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: copy[i].quantity + qty };
        return copy;
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: Number(product.price), quantity: qty },
      ];
    });
    window.M?.toast({ html: "Added to cart", displayLength: 1200 });
  }

  function setQty(id, qty) {
    const q = Math.max(1, parseInt(qty || 1, 10));
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, quantity: q } : x)));
  }

  function inc(id) { setItems((p) => p.map((x) => (x.id === id ? { ...x, quantity: x.quantity + 1 } : x))); }
  function dec(id) {
    setItems((p) =>
      p.map((x) => (x.id === id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))
    );
  }

  function remove(id) { setItems((prev) => prev.filter((x) => x.id !== id)); }
  function clear() { setItems([]); }

  const total = useMemo(
    () => items.reduce((s, x) => s + Number(x.price) * x.quantity, 0),
    [items]
  );

  return (
    <CartCtx.Provider value={{ items, add, setQty, inc, dec, remove, clear, total }}>
      {children}
    </CartCtx.Provider>
  );
}
