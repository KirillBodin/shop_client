// src/auth.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI, ProfileAPI, getToken, setToken } from "./api";
import { useNavigate } from "react-router-dom";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // { id, email, first_name, last_name, role, ... }
  const [loading, setLoading] = useState(true);

  // Инициализация: если есть JWT → пробуем загрузить профиль
  useEffect(() => {
    let ignore = false;
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    ProfileAPI.me()
      .then((u) => { if (!ignore) setUser(u || null); })
      .catch(() => { if (!ignore) { setToken(null); setUser(null); } })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  // Нормализация ошибок из fetch/AuthAPI
  const normalizeError = (e, fallback) => {
    if (!e) return new Error(fallback);
    // api.js бросает Error с .message/.status/.code
    if (e instanceof Error && e.message) return e;
    // иногда возвращается объект { error, message, errors }
    if (typeof e === "object") {
      if (Array.isArray(e.message)) return new Error(e.message.join(", "));
      if (typeof e.message === "string" && e.message.trim()) return new Error(e.message);
      if (e.errors && typeof e.errors === "object") {
        const emailErr = e.errors.email?.[0];
        if (emailErr) {
          if (emailErr.toLowerCase().includes("taken")) return new Error("This email is already registered");
          return new Error(`Email ${emailErr}`);
        }
        const [field, msgs] = Object.entries(e.errors)[0] || [];
        if (field && msgs?.[0]) return new Error(`${field} ${msgs[0]}`);
      }
    }
    return new Error(fallback);
  };

  // --- Actions ---

  // Логин по email/password
  const login = async (email, password) => {
    try {
      await AuthAPI.login({ email, password });     // токен считывается из заголовка внутри api.js
      const me = await ProfileAPI.me().catch(() => ({}));
      setUser(me || { email });                     // на всякий случай
      return me;
    } catch (err) {
      // на всякий случай очищаем токен/стейт
      setToken(null);
      setUser(null);
      throw normalizeError(err, "Invalid email or password");
    }
  };

  // Регистрация
  const register = async ({ email, password, password_confirmation, first_name, last_name }) => {
    try {
      await AuthAPI.register({ email, password, password_confirmation, first_name, last_name });
      const me = await ProfileAPI.me().catch(() => ({}));
      setUser(me || { email, first_name, last_name, role: "user" });
      return me;
    } catch (err) {
      throw normalizeError(err, "Registration failed");
    }
  };

  // Логаут (железный)
  const navigate = useNavigate();
  const logout = () => {
    // чистим токен/стейт
    setToken(null);
    setUser(null);
    // мягкая навигация внутри SPA
    navigate("/auth", { replace: true });
  };

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    login,
    register,
    logout,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
