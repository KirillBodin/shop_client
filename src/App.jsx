// src/App.jsx
import { useEffect } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";

// Pages
import LoginRegister from "./pages/LoginRegister";
import Items from "./pages/Items";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import AdminItems from "./pages/AdminItems";
import AdminUsers from "./pages/AdminUsers";

// --- Guarded route ---
function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ marginTop: 30 }}>Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// --- Redirect from "/" ---
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/catalog" : "/auth"} replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  // Инициализация Materialize (dropdown + sidenav)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Dropdowns
        const ddEls = document.querySelectorAll(".dropdown-trigger");
        if (ddEls.length > 0 && window.M?.Dropdown) {
          window.M.Dropdown.init(ddEls, {
            constrainWidth: false,
            coverTrigger: false,
            alignment: "right",
            // ВАЖНО: не переносим меню в body, чтобы не терять обработчики React.
            // Если твоя сборка всё равно переносит — ниже есть делегирование кликов.
            // container: document.body, // не используем
          });
        }

        // Sidenavs
        const snEls = document.querySelectorAll(".sidenav");
        if (snEls.length > 0 && window.M?.Sidenav) {
          window.M.Sidenav.init(snEls, { edge: "left" });
        }
      } catch (error) {
        console.warn("Materialize initialization error:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  // Делегирование кликов по data-logout (гарантированно работает даже если меню вынесено из React-дерева)
  useEffect(() => {
    function onDocClick(e) {
      const el = e.target.closest("[data-logout]");
      if (el) {
        e.preventDefault();
        logout();
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [logout]);

  return (
    <>
      {/* Navbar */}
      <nav className="blue darken-3">
        <div className="nav-wrapper container">
          {/* Бургер для мобильной sidenav */}
          <a
            href="#!"
            data-target="mobile-sidenav"
            className={`sidenav-trigger ${user ? "" : "hide"}`}
            aria-label="Open menu"
          >
            <i className="material-icons">menu</i>
          </a>

          <Link to="/" className="brand-logo" style={{ fontWeight: 600, fontSize: "1.6rem" }}>
            Shop
          </Link>

          <ul id="nav-desktop" className={`right hide-on-med-and-down ${user ? "" : "hide"}`}>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>

            <li className={isAdmin ? "" : "hide"}>
              <a
                className="dropdown-trigger"
                href="#!"
                data-target="admin-dd"
                aria-haspopup="true"
                aria-controls="admin-dd"
                onClick={(e) => e.preventDefault()}
              >
                Administration ▾
              </a>
            </li>

            <li>
              <a
                className="dropdown-trigger"
                href="#!"
                data-target="user-dd"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-controls="user-dd"
                onClick={(e) => e.preventDefault()}
              >
                <i className="material-icons">person</i>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Admin dropdown — всегда в DOM */}
      <ul id="admin-dd" className="dropdown-content">
        {isAdmin ? (
          <>
            <li><Link to="/admin/items">Items</Link></li>
            <li><Link to="/admin/users">Users</Link></li>
          </>
        ) : (
          <li className="disabled"><a href="#!">No admin</a></li>
        )}
      </ul>

      {/* User dropdown — всегда в DOM */}
      <ul id="user-dd" className="dropdown-content">
        {user ? (
          <>
            <li className="disabled">
              <a href="#!">
                {fullName || "User"}
                {user?.role ? ` (${user.role})` : ""}
              </a>
            </li>
            <li className="divider" tabIndex={-1}></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li className="divider" tabIndex={-1}></li>
            <li>
              {/* data-logout перехватывается делегированием */}
              <a href="#!" data-logout="1">Sign out</a>
            </li>
          </>
        ) : (
          <li className="disabled"><a href="#!">Not signed in</a></li>
        )}
      </ul>

      {/* Mobile sidenav — всегда в DOM */}
      <ul className="sidenav" id="mobile-sidenav">
        {user ? (
          <>
            <li>
              <div className="user-view">
                <div className="background blue lighten-2"></div>
                <span className="white-text name">{fullName || "User"}</span>
                <span className="white-text email">{user?.role || ""}</span>
              </div>
            </li>

            <li><Link to="/catalog">Catalog</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/profile">Profile</Link></li>

            {isAdmin && (
              <>
                <li className="divider" />
                <li><Link to="/admin/items">Admin · Items</Link></li>
                <li><Link to="/admin/users">Admin · Users</Link></li>
              </>
            )}

            <li className="divider" />
            <li>
              {/* data-logout перехватывается делегированием */}
              <a href="#!" data-logout="1">Sign out</a>
            </li>
          </>
        ) : (
          <li className="disabled"><a href="#!">Not signed in</a></li>
        )}
      </ul>

      {/* Content */}
      <main className="container" style={{ marginTop: 30 }}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/auth" element={<LoginRegister />} />

          <Route path="/catalog" element={<Private><Items /></Private>} />
          <Route path="/cart" element={<Private><Cart /></Private>} />
          <Route path="/orders" element={<Private><Orders /></Private>} />
          <Route path="/profile" element={<Private><Profile /></Private>} />

          <Route
            path="/admin/items"
            element={
              <Private>
                {isAdmin ? <AdminItems /> : <Navigate to="/catalog" replace />}
              </Private>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Private>
                {isAdmin ? <AdminUsers /> : <Navigate to="/catalog" replace />}
              </Private>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </main>
    </>
  );
}
