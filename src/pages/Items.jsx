// src/pages/Items.jsx
import { useEffect, useState } from "react";
import { ItemsAPI } from "../api";
import { useCart } from "../cart";

export default function Items() {
  const { add } = useCart(); // <- метод добавления в корзину
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr(null);
    ItemsAPI.list(q)
      .then((d) => !ignore && setList(Array.isArray(d) ? d : []))
      .catch((e) => setErr(e?.message || "Error"))
      .finally(() => setLoading(false));
    return () => { ignore = true; };
  }, [q]);

  return (
    <div>
      {/* Search */}
      <div className="row">
        <div className="col s12 m8 l6">
          <div className="input-field">
            <input
              id="search"
              type="text"
              placeholder="Search by name or description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <label htmlFor="search" className="active">Search…</label>
          </div>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="card-panel red lighten-4 red-text text-darken-4">
          {err}
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="center" style={{ marginTop: 24 }}>
          <div className="preloader-wrapper active">
            <div className="spinner-layer spinner-blue-only">
              <div className="circle-clipper left"><div className="circle" /></div>
              <div className="gap-patch"><div className="circle" /></div>
              <div className="circle-clipper right"><div className="circle" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {!loading && (
        <div className="row">
          {list.map((item) => (
            <div className="col s12 m6 l4" key={item.id}>
              <div className="card hoverable" style={{ height: "100%" }}>
                <div className="card-content">
                  <span className="card-title" style={{ fontWeight: 600 }}>
                    {item.name}
                  </span>
                  <p className="grey-text text-darken-1">{item.description}</p>
                </div>

                {/* bottom row */}
                <div
                  className="card-action"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 16px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 80,
                    }}
                  >
                    {Number(item.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    $
                  </span>

                  <button
                    className="btn waves-effect waves-light"
                    style={{
                      fontSize: "0.8rem",
                      height: 32,
                      lineHeight: "32px",
                      padding: "0 12px",
                    }}
                    onClick={() => add(item)} // <- вот здесь добавление
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!err && !list.length && (
            <div className="col s12">
              <div className="card-panel grey lighten-4 grey-text text-darken-2">
                Nothing found
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
