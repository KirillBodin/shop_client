// ErrorBoundary.jsx (быстрый вариант)
import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return <pre style={{ padding: 16, color: "crimson", whiteSpace: "pre-wrap" }}>
        {String(this.state.err?.stack || this.state.err)}
      </pre>;
    }
    return this.props.children;
  }
}
