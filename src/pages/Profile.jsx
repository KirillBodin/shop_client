// src/pages/Profile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ProfileAPI, AdminUsersAPI } from "../api";
import { useAuth } from "../auth";

export default function Profile() {
  const { user: authUser, setUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [showPass, setShowPass] = useState(false);

  // live-validation errors
  const [vErr, setVErr] = useState({});

  // подтверждение удаления (введённый email)
  const [confirmEmail, setConfirmEmail] = useState("");

  const delModalRef = useRef(null);

  // ---------- validators ----------
  function validate(nextForm) {
    const errors = {};

    const email = (nextForm.email || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) errors.email = "Invalid email";

    if (nextForm.password || nextForm.password_confirmation) {
      if ((nextForm.password || "").length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
      if (nextForm.password !== nextForm.password_confirmation) {
        errors.password_confirmation = "Passwords do not match";
      }
    }
    return errors;
  }

  function onFieldChange(key, value) {
    setOk(null);
    setErr(null);
    const next = { ...form, [key]: value };
    setForm(next);
    setVErr(validate(next));
  }

  useEffect(() => {
    let ignore = false;
    setErr(null);
    setOk(null);
    setLoading(true);

    ProfileAPI.me()
      .then((u) => !ignore && fill(u || authUser))
      .catch(() => fill(authUser))
      .finally(() => !ignore && setLoading(false));

    function fill(u) {
      if (!u) return;
      const filled = {
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        email: u.email || "",
        password: "",
        password_confirmation: "",
      };
      setForm(filled);
      setVErr(validate(filled));
    }

    return () => {
      ignore = true;
    };
  }, [authUser]);

  const canSubmit = useMemo(() => {
    if (!form.email) return false;
    const hasErrors = Object.keys(vErr).length > 0;
    return !hasErrors;
  }, [form.email, vErr]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // финальная проверка
    const errors = validate(form);
    setVErr(errors);
    if (Object.keys(errors).length) {
      const msg = Object.values(errors)[0] || "Please fix validation errors";
      setErr(msg);
      window.M?.toast({ html: msg, classes: "red" });
      return;
    }

    const payload = {};
    if (form.first_name !== authUser?.first_name) payload.first_name = form.first_name;
    if (form.last_name !== authUser?.last_name) payload.last_name = form.last_name;
    if (form.email !== authUser?.email) payload.email = form.email;
    if (form.password || form.password_confirmation) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    if (Object.keys(payload).length === 0) {
      const msg = "Nothing to update";
      setOk(msg);
      window.M?.toast({ html: msg });
      return;
    }

    try {
      const updated = await ProfileAPI.update(payload);
      const u = updated?.user || updated || {};
      setUser({ ...(authUser || {}), ...u, ...payload });

      const msg = "Profile saved";
      setOk(msg);
      window.M?.toast({ html: msg });
      setForm((f) => ({ ...f, password: "", password_confirmation: "" }));
      setVErr(validate({ ...form, password: "", password_confirmation: "" }));
    } catch (e) {
      const msg = e?.message || "Failed to update profile";
      setErr(msg);
      window.M?.toast({ html: msg, classes: "red" });
    }
  }

  function openDeleteConfirm(e) {
    e?.preventDefault?.();
    if (!delModalRef.current) return;

    let instance = window.M?.Modal.getInstance(delModalRef.current);
    if (!instance && window.M?.Modal) {
      instance = window.M.Modal.init(delModalRef.current, {
        opacity: 0.6,
        inDuration: 200,
        outDuration: 160,
        preventScrolling: true,
        dismissible: true,
        endingTop: "20%",
      });
    }
    instance?.open();

    // автофокус на поле подтверждения
    setTimeout(() => {
      try {
        const el = delModalRef.current?.querySelector?.("#confirm_email");
        el?.focus?.();
      } catch {}
    }, 0);
  }

  async function confirmDelete() {
    try {
      const emailToConfirm = (confirmEmail || form.email || authUser?.email || "").trim();
      await AdminUsersAPI.remove(authUser.id, emailToConfirm);

      window.M?.toast({ html: "Account deleted" });
      logout();
    } catch (e) {
      const status = e?.status || e?.response?.status;
      const msgFromServer = e?.response?.data?.message || e?.message;

      let msg = "Failed to delete account (ask administrator)";
      if (status === 422) msg = "Email confirmation does not match";
      if (status === 403) msg = "Forbidden (you cannot delete this account)";
      if (status === 404) msg = "User not found";
      if (msgFromServer) msg = msgFromServer;

      window.M?.toast?.({ html: msg, classes: "red" });
      setErr(msg);
    } finally {
      try {
        window.M?.Modal.getInstance(delModalRef.current)?.close();
      } catch {}
      setConfirmEmail("");
    }
  }

  if (loading) {
    return (
      <div className="center" style={{ marginTop: 32 }}>
        <div className="preloader-wrapper active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left">
              <div className="circle" />
            </div>
            <div className="gap-patch">
              <div className="circle" />
            </div>
            <div className="circle-clipper right">
              <div className="circle" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const emailMustMatch = (form.email || authUser?.email || "").trim().toLowerCase();
  const deleteDisabled = confirmEmail.trim().toLowerCase() !== emailMustMatch;

  return (
    <div className="row" style={{ marginTop: 8 }}>
      <div className="col s12 m8 l6 offset-m2 offset-l3">
        <h4 style={{ margin: "16px 0 18px", textAlign: "center" }}>My profile</h4>

        {err && <div className="card-panel red lighten-4 red-text text-darken-4">{err}</div>}
        {ok && <div className="card-panel green lighten-4 green-text text-darken-4">{ok}</div>}

        <form onSubmit={onSubmit}>
          <div className="row" style={{ marginBottom: 0 }}>
            <div className="input-field col s12 m6">
              <input
                id="first_name"
                type="text"
                value={form.first_name}
                onChange={(e) => onFieldChange("first_name", e.target.value)}
              />
              <label htmlFor="first_name" className="active">
                First name (optional)
              </label>
            </div>
            <div className="input-field col s12 m6">
              <input
                id="last_name"
                type="text"
                value={form.last_name}
                onChange={(e) => onFieldChange("last_name", e.target.value)}
              />
              <label htmlFor="last_name" className="active">
                Last name (optional)
              </label>
            </div>
          </div>

          <div className="input-field">
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => onFieldChange("email", e.target.value)}
              className={vErr.email ? "invalid" : form.email ? "valid" : ""}
            />
            <label htmlFor="email" className="active">
              Email *
            </label>
            <span className={`helper-text ${vErr.email ? "red-text" : "green-text"}`}>
              {vErr.email
                ? vErr.email
                : form.email
                ? "Looks good"
                : "Must be a valid email address"}
            </span>
          </div>

          <div className="card-panel yellow lighten-5" style={{ padding: 14 }}>
            <span className="grey-text text-darken-2" style={{ fontWeight: 600 }}>
              Change password (optional)
            </span>

            <div className="input-field" style={{ marginTop: 8 }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => onFieldChange("password", e.target.value)}
                placeholder="New password"
                minLength={6}
                className={vErr.password ? "invalid" : form.password ? "valid" : ""}
              />
              <label htmlFor="password" className="active">
                Password
              </label>
              <span
                className={`helper-text ${
                  vErr.password ? "red-text" : form.password ? "green-text" : ""
                }`}
              >
                {vErr.password
                  ? vErr.password
                  : form.password
                  ? "Looks good"
                  : "Leave empty to keep current password"}
              </span>
            </div>

            <div className="input-field" style={{ marginTop: 8 }}>
              <input
                id="password_confirmation"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(e) => onFieldChange("password_confirmation", e.target.value)}
                placeholder="Repeat new password"
                minLength={6}
                className={
                  vErr.password_confirmation ? "invalid" : form.password_confirmation ? "valid" : ""
                }
              />
              <label htmlFor="password_confirmation" className="active">
                Confirm password
              </label>
              <span
                className={`helper-text ${
                  vErr.password_confirmation
                    ? "red-text"
                    : form.password_confirmation
                    ? "green-text"
                    : ""
                }`}
              >
                {vErr.password_confirmation
                  ? vErr.password_confirmation
                  : form.password_confirmation
                  ? "Looks good"
                  : "Enter both password and confirmation"}
              </span>
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                className="filled-in"
                checked={showPass}
                onChange={() => setShowPass(!showPass)}
              />
              <span>Show password</span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button type="button" className="btn-flat red-text" onClick={openDeleteConfirm}>
              Delete account
            </button>

            <button
              type="submit"
              className={`btn waves-effect waves-light ${!canSubmit ? "disabled" : ""}`}
              disabled={!canSubmit}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>

      {/* compact confirm modal */}
      <div
        ref={delModalRef}
        className="modal"
        id="deleteAccountModal"
        style={{
          maxWidth: "420px",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className="modal-content" style={{ padding: "18px 20px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              className="red white-text"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 18,
                boxShadow: "0 2px 6px rgba(0,0,0,.15)",
              }}
            >
              !
            </div>
            <h6 style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>Delete account</h6>
          </div>

          <p className="grey-text text-darken-2" style={{ marginTop: 4, fontSize: "0.95rem", lineHeight: 1.4 }}>
            This will permanently remove your account and order history. <br />
            <span className="red-text text-darken-2" style={{ fontWeight: 600 }}>
              This action cannot be undone.
            </span>
          </p>

          {/* поле подтверждения email */}
          <div className="input-field" style={{ marginTop: 12 }}>
            <input
              id="confirm_email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Type your email to confirm"
              autoComplete="off"
            />
            <label htmlFor="confirm_email" className="active">
              Confirm email
            </label>
            <span className="helper-text">
              Enter <b>{form.email || authUser?.email}</b> to confirm deletion
            </span>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "10px 16px",
            borderTop: "1px solid #eee",
          }}
        >
          <button type="button" className="btn-flat modal-close">
            Cancel
          </button>
          <button
            type="button"
            className={`btn red ${deleteDisabled ? "disabled" : ""}`}
            onClick={confirmDelete}
            disabled={deleteDisabled}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
