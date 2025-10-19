// src/main.jsx
import "materialize-css/dist/css/materialize.min.css";
import "materialize-css/dist/js/materialize.min.js";
import ErrorBoundary from "./ErrorBoundary";

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth";
import { CartProvider } from "./cart";

ReactDOM.createRoot(document.getElementById("root")).render(
  <HashRouter>
    <ErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  </HashRouter>
);
