// src/main.jsx
// Materialize CSS убран для решения проблемы с logout
import "./styles.css";
import { M, Modal } from "./utils";

// Делаем утилиты доступными глобально для совместимости
window.M = M;
window.Modal = Modal;

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
    // Игнорируем ошибки removeChild
    if (error && error.message && error.message.includes('removeChild')) {
      console.warn("Ignoring removeChild error in ErrorBoundary:", error);
      return;
    }
    
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

// Глобальный обработчик ошибок для предотвращения краша приложения
window.addEventListener('error', (event) => {
  // Перехватываем ошибки removeChild
  if (event.error && (
      (event.error.message && event.error.message.includes('removeChild')) ||
      (event.error.stack && event.error.stack.includes('removeChild'))
  )) {
    console.warn('Caught removeChild error, preventing crash:', event.error);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  
  // Перехватываем DOMException с removeChild
  if (event.error instanceof DOMException && 
      event.error.message.includes('removeChild')) {
    console.warn('Caught DOMException removeChild error, preventing crash:', event.error);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Перехватываем Promise rejections с removeChild
  if (event.reason && (
      (event.reason.message && event.reason.message.includes('removeChild')) ||
      (event.reason.stack && event.reason.stack.includes('removeChild'))
  )) {
    console.warn('Caught removeChild promise rejection, preventing crash:', event.reason);
    event.preventDefault();
    return false;
  }
});

// Дополнительная защита - перехватываем все ошибки React Fiber
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('removeChild') && message.includes('not a child')) {
    console.warn('Suppressed React Fiber removeChild error:', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

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
