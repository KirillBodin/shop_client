// src/main.jsx
import "materialize-css/dist/css/materialize.min.css";
import "materialize-css/dist/js/materialize.min.js";

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth";
import { CartProvider } from "./cart";

// --- ErrorBoundary на случай непойманных ошибок React ---
function ErrorBoundary({ children }) {
  const [error, setError] = React.useState(null);

  if (error) {
    return (
      <div
        style={{
          padding: 30,
          color: "#c00",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
        }}
      >
        <h3>⚠️ App crashed</h3>
        {String(error.stack || error.message || error)}
      </div>
    );
  }

  return (
    <React.ErrorBoundary
      fallbackRender={({ error }) => setError(error)}
      onError={(e) => setError(e)}
    >
      {children}
    </React.ErrorBoundary>
  );
}

// --- React 18 Root render ---
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  </React.StrictMode>
);
