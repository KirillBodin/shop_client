// src/pages/Orders.jsx
import { useEffect, useState } from "react";
import { OrdersAPI } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setErr(null);
    setLoading(true);
    OrdersAPI.list()
      .then((data) => { if (!ignore) setOrders(data || []); })
      .catch((e) => setErr(e?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
    return () => { ignore = true; };
  }, []);

  return (
    <div className="row">
      <div className="col s12"><h4>My orders</h4></div>

      {err && (
        <div className="col s12">
          <div className="card-panel red lighten-4 red-text text-darken-4">{err}</div>
        </div>
      )}

      {loading && (
        <div className="col s12 center" style={{ marginTop: 16 }}>
          <div className="preloader-wrapper active">
            <div className="spinner-layer spinner-blue-only">
              <div className="circle-clipper left"><div className="circle" /></div>
              <div className="gap-patch"><div className="circle" /></div>
              <div className="circle-clipper right"><div className="circle" /></div>
            </div>
          </div>
        </div>
      )}

      {!loading && !orders.length && !err && (
        <div className="col s12">
          <div className="card-panel grey lighten-4 grey-text text-darken-2">
            You have no orders yet
          </div>
        </div>
      )}

      {!loading && orders.map((o) => (
        <div className="col s12" key={o.id}>
          <div className="card">
            <div className="card-content" style={{ cursor: "pointer" }} onClick={() => setOpenId(openId === o.id ? null : o.id)}>
              <span className="card-title">
                Order #{o.id} — {Number(o.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="grey-text">{new Date(o.created_at).toLocaleString()}</p>
            </div>

            {openId === o.id && (
              <div className="card-content">
                <table className="striped">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="right-align">Price</th>
                      <th className="center-align">Qty</th>
                      <th className="right-align">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(o.order_descriptions || o.order_items || []).map((od) => {
                      const item = od.item || {};
                      const price = Number(item.price || 0);
                      const qty = Number(od.quantity || 0);
                      const line = price * qty;
                      return (
                        <tr key={od.id}>
                          <td>{item.name}</td>
                          <td className="right-align">{price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="center-align">{qty}</td>
                          <td className="right-align">{line.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
