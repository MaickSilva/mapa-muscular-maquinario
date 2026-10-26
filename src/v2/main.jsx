import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { window.__showBootError?.(String(error?.stack || error)); }
  render() { return this.state.error ? null : this.props.children; }
}

try {
  createRoot(document.getElementById("root")).render(<ErrorBoundary><App /></ErrorBoundary>);
  window.__appStarted = true;
} catch (e) {
  window.__showBootError?.(String(e?.stack || e));
}
