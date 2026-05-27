import React from "react";
import { frontendLogger } from "../utils/frontendLogger";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    frontendLogger.error("React render error", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#ffffff",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "28px",
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <h1 style={{ marginBottom: "12px", fontSize: "24px" }}>
              Что-то пошло не так
            </h1>

            <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              Ошибка была обработана системой. Обновите страницу или попробуйте
              выполнить действие позже.
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                border: "none",
                borderRadius: "12px",
                padding: "12px 18px",
                background: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;