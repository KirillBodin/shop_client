// src/pages/AdminItems.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemsAPI, ItemsAPIEx } from "../api";

export default function AdminItems() {
  // --- list state ---
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // --- editor state (modal) ---
  const [editing, setEditing] = useState(null); // item | null
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const isEdit = useMemo(() => Boolean(editing?.id), [editing]);

  // --- modals refs ---
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const deleteIdRef = useRef(null);

  // init materialize modals
  useEffect(() => {
    const opts = { dismissible: true };
    const m1 = window.M?.Modal.init(editModalRef.current, opts);
    const m2 = window.M?.Modal.init(deleteModalRef.current, opts);
    return () => {
      try { m1?.destroy(); m2?.destroy(); } catch {}
    };
  }, []);

  // debounced search
  useEffect(() => {
    let id = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await ItemsAPI.list(q.trim());
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => { load(); }, []);

  // open editor
  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "" });
    window.M?.Modal.getInstance(editModalRef.current)?.open();
  }
  function openEdit(it) {
    setEditing(it);
    setForm({
      name: it?.name || "",
      description: it?.description || "",
      price: it?.price != null ? String(it.price) : "",
    });
    window.M?.Modal.getInstance(editModalRef.current)?.open();
  }

  // save editor
  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(parseFloat(form.price || "0").toFixed(2)),
    };
    if (!payload.name) return setErr("Name is required");
    if (Number.isNaN(payload.price) || payload.price < 0) {
      return setErr("Price must be a non-negative number");
    }

    try {
      if (isEdit) {
        await ItemsAPIEx.update(editing.id, payload);
        window.M?.toast({ html: "Item updated" });
      } else {
        await ItemsAPIEx.create(payload);
        window.M?.toast({ html: "Item created" });
      }
      window.M?.Modal.getInstance(editModalRef.current)?.close();
      await load();
    } catch (e) {
      setErr(e?.message || "Save failed");
    }
  }

  function askDelete(id) {
    deleteIdRef.current = id;
    window.M?.Modal.getInstance(deleteModalRef.current)?.open();
  }

  async function confirmDelete() {
    const id = deleteIdRef.current;
    if (!id) return;
    try {
      await ItemsAPIEx.remove(id);
      window.M?.toast({ html: "Item deleted" });
      await load();
    } catch (e) {
      window.M?.toast({ html: e?.message || "Delete failed", classes: "red" });
    } finally {
      deleteIdRef.current = null;
      window.M?.Modal.getInstance(deleteModalRef.current)?.close();
    }
  }

  return (
    <div className="row">
      <div className="col s12" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h4 style={{ marginRight: "auto" }}>Administration · Items</h4>
        <a className="btn waves-effect waves-light" onClick={openCreate}>
          New item
        </a>
      </div>

      {/* Search */}
      <div className="col s12 m8 l6">
        <div className="input-field" style={{ marginTop: 0 }}>
          <input
            id="items_q"
            placeholder="Search by name or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label htmlFor="items_q" className="active">Search</label>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="col s12">
          <div className="card-panel red lighten-4 red-text text-darken-4">{err}</div>
        </div>
      )}

      {/* List */}
      <div className="col s12">
        {loading ? (
          <div className="center" style={{ marginTop: 24 }}>
            <div className="preloader-wrapper active">
              <div className="spinner-layer spinner-blue-only">
                <div className="circle-clipper left"><div className="circle" /></div>
                <div className="gap-patch"><div className="circle" /></div>
                <div className="circle-clipper right"><div className="circle" /></div>
              </div>
            </div>
          </div>
        ) : (
          <table className="striped responsive-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th className="right-align" style={{ width: 140 }}>Price</th>
                <th className="center-align" style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="grey-text">{it.id}</td>
                  <td style={{ fontWeight: 600 }}>{it.name}</td>
                  <td className="grey-text text-darken-1" style={{ maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.description}
                  </td>
                  <td className="right-align">
                    {Number(it.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="center-align" style={{ whiteSpace: "nowrap" }}>
                    <a className="btn-flat" onClick={() => openEdit(it)}>
                      <i className="material-icons left">edit</i>Edit
                    </a>
                    <a className="btn-flat red-text text-darken-1" onClick={() => askDelete(it.id)}>
                      <i className="material-icons left">delete</i>Delete
                    </a>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={5} className="grey-text center">No items</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Edit/Create modal --- */}
      <div ref={editModalRef} id="editModal" className="modal">
        <div className="modal-content">
          <h5 style={{ marginBottom: 16 }}>{isEdit ? `Edit item #${editing?.id}` : "Create new item"}</h5>

          <form onSubmit={onSubmit}>
            <div className="row" style={{ marginBottom: 0 }}>
              <div className="input-field col s12 m8">
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <label htmlFor="name" className="active">Name</label>
              </div>
              <div className="input-field col s12 m4">
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <label htmlFor="price" className="active">Price</label>
              </div>
            </div>

            <div className="input-field">
              <textarea
                id="description"
                className="materialize-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <label htmlFor="description" className="active">Description</label>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <a className="btn-flat modal-close">Cancel</a>
              <button type="submit" className="btn waves-effect waves-light">
                {isEdit ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- Delete confirm modal --- */}
      <div ref={deleteModalRef} id="deleteModal" className="modal">
        <div className="modal-content">
          <h5>Delete item</h5>
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <a className="btn-flat modal-close">Cancel</a>
          <a className="btn red" onClick={confirmDelete}>Delete</a>
        </div>
      </div>
    </div>
  );
}
