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

  const handleError = (error, errorInfo) => {
    console.error("React Error Boundary caught an error:", error, errorInfo);
    setError(error);
  };

  const resetError = () => {
    setError(null);
  };

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
        <p>Error: {String(error.message || error)}</p>
        <button 
          onClick={resetError}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px"
          }}
        >
          Try Again
        </button>
        {error.stack && (
          <details style={{ marginTop: "20px" }}>
            <summary>Stack Trace</summary>
            <pre style={{ fontSize: "12px", marginTop: "10px" }}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <React.ErrorBoundary
      fallbackRender={({ error, resetError }) => {
        handleError(error);
        return null;
      }}
      onError={handleError}
    >
      {children}
    </React.ErrorBoundary>
  );
}

// --- Глобальный обработчик ошибок для React Fiber ---
window.addEventListener('error', (event) => {
  if (event.error && (
      (event.error.message && event.error.message.includes('removeChild')) ||
      (event.error.stack && event.error.stack.includes('removeChild'))
  )) {
    console.warn('Caught React Fiber removeChild error, ignoring:', event.error);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
      (event.reason.message && event.reason.message.includes('removeChild')) ||
      (event.reason.stack && event.reason.stack.includes('removeChild'))
  )) {
    console.warn('Caught React Fiber removeChild promise rejection, ignoring:', event.reason);
    event.preventDefault();
    return false;
  }
});

// Дополнительная защита - перехватываем все DOMException
window.addEventListener('error', (event) => {
  if (event.error instanceof DOMException && 
      event.error.message.includes('removeChild')) {
    console.warn('Caught DOMException removeChild error, ignoring:', event.error);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

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
