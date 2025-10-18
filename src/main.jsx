// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";

// Если у тебя есть глобальные провайдеры (AuthProvider, CartProvider и т.п.),
// оберни <App /> ими здесь. Пример:
// import { AuthProvider } from "./auth";
// import { CartProvider } from "./cart";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      {/* <AuthProvider>
        <CartProvider> */}
          <App />
      {/*  </CartProvider>
      </AuthProvider> */}
    </Router>
  </React.StrictMode>
);
