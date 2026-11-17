import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "#EDEDED", background: "#0D0D0D", height: "100%", overflowY: "auto" }}>
          <h2 style={{ color: "var(--orange)", marginBottom: 12 }}>Something encountered an issue in this view</h2>
          <p style={{ color: "#A1A1AA", marginBottom: 16 }}>{this.state.error?.message || "Unknown error"}</p>
          {this.state.error?.stack && (
            <pre style={{ fontSize: 11, background: "#18181B", color: "#F87171", padding: 12, borderRadius: 6, overflow: "auto", whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 300 }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
            style={{ padding: "8px 16px" }}
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
