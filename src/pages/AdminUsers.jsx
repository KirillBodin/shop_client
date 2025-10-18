// src/pages/AdminUsers.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminUsersAPI } from "../api";
import { useAuth } from "../auth";

export default function AdminUsers() {
  const { user: me } = useAuth();

  // --- list state ---
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // --- editor state (modal) ---
  // editing === null → модалка закрыта
  // editing === {}   → режим создания
  // editing === {id, ...} → режим редактирования
  const [editing, setEditing] = useState(null);
  const isCreate = editing && !editing.id;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
    password: "",
    password_confirmation: "",
  });

  // Ошибка внутри модалки
  const [modalErr, setModalErr] = useState(null);

  // --- modals refs ---
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const deleteIdRef = useRef(null);

  // init Materialize modals
  useEffect(() => {
    const opts = { dismissible: true };
    const m1 = window.M?.Modal.init(editModalRef.current, opts);
    const m2 = window.M?.Modal.init(deleteModalRef.current, opts);
    return () => {
      try { m1?.destroy(); m2?.destroy(); } catch {}
    };
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await AdminUsersAPI.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // initial
  useEffect(() => { load(); }, []);

  // client-side search
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email} ${u.role}`.toLowerCase().includes(qq)
    );
  }, [users, q]);

  // --- open editor (edit) ---
  function openEdit(u) {
    setModalErr(null);
    setEditing(u);
    setForm({
      first_name: u?.first_name || "",
      last_name:  u?.last_name  || "",
      email:      u?.email      || "",
      role:       u?.role       || "user",
      password: "",
      password_confirmation: "",
    });
    window.M?.Modal.getInstance(editModalRef.current)?.open();
  }

  // --- open editor (create) ---
  function openCreate() {
    setModalErr(null);
    setEditing({});
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      role: "user",
      password: "",
      password_confirmation: "",
    });
    window.M?.Modal.getInstance(editModalRef.current)?.open();
  }

  // --- save editor (create/update) ---
  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setModalErr(null);

    const payload = {
      first_name: form.first_name.trim(),
      last_name:  form.last_name.trim(),
      email:      form.email.trim(),
      role:       form.role,
    };

    const pwd  = form.password?.trim();
    const conf = form.password_confirmation?.trim();

    try {
      if (isCreate) {
        if (!pwd || !conf) { setModalErr("Password and confirmation are required"); return; }
        if (pwd !== conf)  { setModalErr("Password confirmation does not match"); return; }
        payload.password = pwd;
        payload.password_confirmation = conf;
        await AdminUsersAPI.create(payload);
        window.M?.toast({ html: "User created" });
      } else {
        if (!editing?.id) return;
        if (pwd || conf) {
          if (!pwd || !conf) { setModalErr("Enter both password and confirmation"); return; }
          if (pwd !== conf)  { setModalErr("Password confirmation does not match"); return; }
          payload.password = pwd;
          payload.password_confirmation = conf;
        }
        await AdminUsersAPI.update(editing.id, payload);
        window.M?.toast({ html: "User updated" });
      }

      window.M?.Modal.getInstance(editModalRef.current)?.close();
      await load();
    } catch (e) {
      // Показать прямо в модалке
      const msg = e?.message || "Save failed";
      setModalErr(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  // --- delete flow ---
  function askDelete(id) {
    if (id === me?.id) {
      window.M?.toast({ html: "You can't delete yourself", classes: "orange" });
      return;
    }
    deleteIdRef.current = id;
    window.M?.Modal.getInstance(deleteModalRef.current)?.open();
  }

  async function confirmDelete() {
    const id = deleteIdRef.current;
    if (!id) return;
    try {
      await AdminUsersAPI.remove(id);
      window.M?.toast({ html: "User deleted" });
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
        <h4 style={{ marginRight: "auto" }}>Management · Users</h4>
        <a className="btn" onClick={openCreate}>NEW USER</a>
      </div>

      {/* Search */}
      <div className="col s12 m8 l6">
        <div className="input-field" style={{ marginTop: 0 }}>
          <input
            id="users_q"
            placeholder="Search name, email or role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label htmlFor="users_q" className="active">Search</label>
        </div>
      </div>

      {/* Error (страничная) */}
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
                <th>Email</th>
                <th style={{ width: 120 }}>Role</th>
                <th className="center-align" style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="grey-text">{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                  <td className="grey-text text-darken-1">{u.email}</td>
                  <td>{u.role}</td>
                  <td className="center-align" style={{ whiteSpace: "nowrap" }}>
                    <a className="btn-flat" onClick={() => openEdit(u)}>Edit</a>
                    <a
                      className={`btn-flat red-text text-darken-1 ${u.id === me?.id ? "disabled" : ""}`}
                      onClick={() => (u.id === me?.id ? null : askDelete(u.id))}
                    >
                      Delete
                    </a>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="grey-text center">No users</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Edit/Create modal --- */}
      <div
        ref={editModalRef}
        id="editModal"
        className="modal"
        style={{
          maxHeight: "none",
          width: "800px",
          maxWidth: "95vw",
        }}
      >
        <div className="modal-content" style={{ paddingBottom: 8 }}>
          <h5 style={{ marginBottom: 16 }}>
            {isCreate ? "Create user" : `Edit user #${editing?.id}`}
          </h5>

          {modalErr && (
            <div
              className="card-panel red lighten-4 red-text text-darken-4"
              style={{ marginTop: 0, marginBottom: 16 }}
            >
              {modalErr}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="row" style={{ marginBottom: 0 }}>
              <div className="input-field col s12 m6">
                <input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
                <label htmlFor="first_name" className="active">First name</label>
              </div>
              <div className="input-field col s12 m6">
                <input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
                <label htmlFor="last_name" className="active">Last name</label>
              </div>
            </div>

            <div className="row" style={{ marginBottom: 0 }}>
              <div className="input-field col s12 m8">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <label htmlFor="email" className="active">Email</label>
              </div>

              <div className="input-field col s12 m4" style={{ marginTop: 0 }}>
                <label
                  htmlFor="role"
                  className="active"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Role
                </label>
                <select
                  id="role"
                  className="browser-default"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div className="card-panel yellow lighten-5" style={{ padding: 12, marginTop: 8 }}>
              <span className="grey-text text-darken-2" style={{ display: "block", marginBottom: 6 }}>
                {isCreate ? "Set password" : "Change password (optional)"}
              </span>

              <div className="row" style={{ marginBottom: 0 }}>
                <div className="input-field col s12 m6">
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={6}
                    placeholder={isCreate ? "Password" : "New password"}
                    required={isCreate}
                  />
                  <label htmlFor="password" className="active">Password</label>
                </div>
                <div className="input-field col s12 m6">
                  <input
                    id="password_confirmation"
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    minLength={6}
                    placeholder={isCreate ? "Confirm password" : "Repeat new password"}
                    required={isCreate}
                  />
                  <label htmlFor="password_confirmation" className="active">Confirm password</label>
                </div>
              </div>

              {!isCreate && (
                <div className="grey-text" style={{ fontSize: 12 }}>
                  Enter both password and confirmation to reset password.
                  If one of them is empty, the password will not be changed.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 24px" }}>
              <a className="btn-flat modal-close" onClick={() => setModalErr(null)}>Cancel</a>
              <button type="submit" className="btn waves-effect waves-light">
                {isCreate ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- Delete confirm modal --- */}
      <div ref={deleteModalRef} id="deleteModal" className="modal">
        <div className="modal-content">
          <h5>Delete user</h5>
          <p>Are you sure you want to delete this user? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <a className="btn-flat modal-close">Cancel</a>
          <a className="btn red" onClick={confirmDelete}>Delete</a>
        </div>
      </div>
    </div>
  );
}
