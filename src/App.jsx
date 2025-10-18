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

// Guarded route
function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ marginTop: 30 }}>Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// Redirect from "/"
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/catalog" : "/auth"} replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const dds = document.querySelectorAll(".dropdown-trigger");
    window.M?.Dropdown.init(dds, { constrainWidth: false, coverTrigger: false, alignment: "right" });

    const sidenavs = document.querySelectorAll(".sidenav");
    window.M?.Sidenav.init(sidenavs, { edge: "left" });
  }, [user, isAdmin]);

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <>
      {/* Navbar */}
      <nav className="blue darken-3">
        <div className="nav-wrapper container">
          {/* Бургер для мобильной sidenav */}
          {user && (
            <a href="#!" data-target="mobile-sidenav" className="sidenav-trigger">
              <i className="material-icons">menu</i>
            </a>
          )}

          <Link to="/" className="brand-logo" style={{ fontWeight: 600, fontSize: "1.6rem" }}>
            Shop
          </Link>

          {user && (
            <ul id="nav-desktop" className="right hide-on-med-and-down">
              {/* Отдельная ссылка Cart */}
              <li><Link to="/cart">Cart</Link></li>

              {/* Catalog всегда под рукой */}
              <li><Link to="/catalog">Catalog</Link></li>

              {/* Admin dropdown */}
              {isAdmin && (
                <li>
                  <a className="dropdown-trigger" href="#!" data-target="admin-dd">
                    Administration ▾
                  </a>
                </li>
              )}

              {/* Иконка пользователя = dropdown со списком Profile / Orders / Sign out */}
              <li>
                <a className="dropdown-trigger" href="#!" data-target="user-dd" aria-label="Account menu">
                  <i className="material-icons">person</i>
                </a>
              </li>
            </ul>
          )}
        </div>
      </nav>

      {/* Admin dropdown */}
      {isAdmin && (
        <ul id="admin-dd" className="dropdown-content">
          <li><Link to="/admin/items">Items</Link></li>
          <li><Link to="/admin/users">Users</Link></li>
        </ul>
      )}

      {/* User dropdown (на иконке «person») */}
      {user && (
        <ul id="user-dd" className="dropdown-content">
          <li className="disabled"><a href="#!">{fullName || "User"}{user?.role ? ` (${user.role})` : ""}</a></li>
          <li className="divider" tabIndex="-1"></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/orders">Orders</Link></li>
          <li className="divider" tabIndex="-1"></li>
          <li><a href="#!" onClick={logout}>Sign out</a></li>
        </ul>
      )}

      {/* Mobile sidenav */}
      {user && (
        <ul className="sidenav" id="mobile-sidenav">
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
          <li><a href="#!" onClick={logout}>Sign out</a></li>
        </ul>
      )}

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
