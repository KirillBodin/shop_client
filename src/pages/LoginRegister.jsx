import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";



function humanizeAuthError(err, { isLogin } = {}) {
  // 1) Если нам бросили обычный Error
  if (err instanceof Error && err.message) return err.message;

  // 2) Если это JSON-ответ, который бросили из api.js / AuthAPI.*
  if (err && typeof err === "object") {
    // формат: { error: 'validation_failed', message: ['...','...'] }
    if (Array.isArray(err.message)) return err.message.join(", ");
    if (typeof err.message === "string" && err.message.trim()) return err.message;

    // формат devise: { errors: { email: ['has already been taken'] } }
    if (err.errors && typeof err.errors === "object") {
      // любимая ситуация: email уже занят
      const emailErr = err.errors.email?.[0];
      if (emailErr) {
        if (emailErr.toLowerCase().includes("taken")) return "This email is already registered";
        return `Email ${emailErr}`;
      }
      // берём первое поле/ошибку
      const [field, msgs] = Object.entries(err.errors)[0] || [];
      if (field && msgs?.[0]) return `${field} ${msgs[0]}`;
    }

    // иногда шлём просто { error, status }
    if (err.status === 401 || err.error === "unauthorized") {
      return isLogin ? "Invalid email or password" : "Unauthorized";
    }
  }

  // 3) Фолбэк
  return isLogin ? "Authentication error" : "Registration failed";
}


export default function LoginRegister() {
  const { login, register } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const isLogin = mode === "login";

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        window.M?.toast({ html: "Signed in successfully", displayLength: 2000 });
      } else {
        if (form.password !== form.password_confirmation) {
          throw new Error("Password confirmation does not match");
        }
        await register({
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          first_name: form.first_name,
          last_name: form.last_name,
        });
        window.M?.toast({ html: "Account created", displayLength: 2000 });
      }

      nav("/catalog", { replace: true });
    } catch (e) {
      const message = humanizeAuthError(e, { isLogin });
      setErr(message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode(next) {
    setMode(next);
    setErr(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirmation: "",
    });
  }

  return (
    <div
      className="valign-wrapper"
      style={{
        minHeight: "85vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="card z-depth-3" style={{ width: 450, paddingBottom: 15 }}>
        <div className="card-content">
          {/* Custom tabs */}
          <div
            className="row"
            style={{
              display: "flex",
              justifyContent: "space-around",
              borderBottom: "1px solid #ddd",
              marginBottom: 20,
            }}
          >
            <div
              onClick={() => toggleMode("login")}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 0",
                cursor: "pointer",
                color: isLogin ? "#1976d2" : "#999",
                fontWeight: isLogin ? 600 : 400,
                borderBottom: isLogin ? "3px solid #1976d2" : "3px solid transparent",
                transition: "0.3s",
              }}
            >
              Sign in
            </div>
            <div
              onClick={() => toggleMode("register")}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 0",
                cursor: "pointer",
                color: !isLogin ? "#1976d2" : "#999",
                fontWeight: !isLogin ? 600 : 400,
                borderBottom: !isLogin ? "3px solid #1976d2" : "3px solid transparent",
                transition: "0.3s",
              }}
            >
              Create account
            </div>
          </div>

          <span
            className="card-title"
            style={{
              fontWeight: 700,
              marginTop: 10,
              fontSize: 22,
              textAlign: "center",
              display: "block",
            }}
          >
            {isLogin ? "Welcome backl" : "Join us"}
          </span>

          {err && (
            <div
              className="card-panel red lighten-4 red-text text-darken-4"
              style={{ marginTop: 12 }}
            >
              {err}
            </div>
          )}

<form onSubmit={onSubmit} style={{ marginTop: 12 }}>
  <div className="row" style={{ marginBottom: 0 }}>
    {!isLogin && (
      <div>
        <div className="input-field col s6">
          <input
            id="first_name"
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
          />
          <label htmlFor="first_name" className="active">First name</label>
        </div>

        <div className="input-field col s6">
          <input
            id="last_name"
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
          />
          <label htmlFor="last_name" className="active">Last name</label>
        </div>
      </div>
    )}

    <div className="input-field col s12">
      <input
        id="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <label htmlFor="email" className="active">Email</label>
    </div>

    <div className="input-field col s12">
      <input
        id="password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        minLength={6}
      />
      <label htmlFor="password" className="active">Password</label>
    </div>

    {!isLogin && (
      <div className="input-field col s12">
        <input
          id="password_confirmation"
          type="password"
          value={form.password_confirmation}
          onChange={(e) =>
            setForm({ ...form, password_confirmation: e.target.value })
          }
          required
          minLength={6}
        />
        <label htmlFor="password_confirmation" className="active">
          Confirm password
        </label>
      </div>
    )}
  </div>

  <div style={{ textAlign: "center", marginTop: 20 }}>
    <button
      type="submit"
      className={`btn waves-effect waves-light ${submitting ? "disabled" : ""}`}
      disabled={submitting}
    >
      {submitting ? "Please wait..." : isLogin ? "Sign in" : "Create accountf"}
    </button>
  </div>
</form>

        </div>

        <div
          className="card-action"
          style={{ textAlign: "center", borderTop: "1px solid #eee" }}
        >
          {isLogin ? (
            <span>
              Don’t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMode("register");
                }}
                style={{ color: "#1976d2" }}
              >
                Sign up
              </a>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMode("login");
                }}
                style={{ color: "#1976d2" }}
              >
                Sign in
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
