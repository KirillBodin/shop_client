// src/pages/Cart.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../cart";
import { OrdersAPI } from "../api";

export default function Cart() {
  const nav = useNavigate();
  const { items, inc, dec, setQty, remove, clear, total } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  async function checkout() {
    setErr(null);
    if (!items.length) return;
    setSubmitting(true);

    try {
      // сервер ждёт: { items: [{ item_id, quantity }, ...] }
      const payload = items.map((x) => ({ item_id: x.id, quantity: x.quantity }));
      const order = await OrdersAPI.create(payload);

      window.M?.toast({ html: `Order #${order.id} placed`, displayLength: 2000 });
      clear();
      nav("/catalog", { replace: true });
    } catch (e) {
      setErr(e?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row">
      <div className="col s12">
        <h4>Cart</h4>
      </div>

      {err && (
        <div className="col s12">
          <div className="card-panel red lighten-4 red-text text-darken-4">{err}</div>
        </div>
      )}

      {!items.length ? (
        <div className="col s12">
          <div className="card-panel grey lighten-4 grey-text text-darken-2">
            Your cart is empty
          </div>
        </div>
      ) : (
        <div>
          <div className="col s12">
            <table className="striped responsive-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>Item</th>
                  <th className="right-align">Price</th>
                  <th className="center-align" style={{ width: 180 }}>Qty</th>
                  <th className="right-align">Line total</th>
                  <th className="center-align" style={{ width: 60 }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td>{x.name}</td>
                    <td className="right-align">
                      {Number(x.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="center-align">
                      <div className="valign-wrapper" style={{ justifyContent: "center", gap: 6 }}>
                        <a className="btn-flat waves-effect" onClick={() => dec(x.id)}>-</a>
                        <input
                          type="number"
                          min="1"
                          value={x.quantity}
                          onChange={(e) => setQty(x.id, e.target.value)}
                          style={{ width: 64, textAlign: "center" }}
                        />
                        <a className="btn-flat waves-effect" onClick={() => inc(x.id)}>+</a>
                      </div>
                    </td>
                    <td className="right-align">
                      {(Number(x.price) * x.quantity).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="center-align">
                      <a className="btn-flat waves-effect red-text text-darken-1" onClick={() => remove(x.id)}>✕</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="col s12" style={{ marginTop: 12 }}>
            <div className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b>Total:</b>{" "}
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a className="btn-flat" onClick={clear}>Clear</a>
                <a
                  className={`btn waves-effect waves-light ${submitting || !items.length ? "disabled" : ""}`}
                  onClick={checkout}
                >
                  {submitting ? "Processing…" : "Checkout"}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
