type LogLevel = "info" | "warning" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  details?: unknown;
  createdAt: string;
};

const isProduction = process.env.NODE_ENV === "production";

export const frontendLogger = {
  info(message: string, details?: unknown) {
    sendLog({
      level: "info",
      message,
      details,
      createdAt: new Date().toISOString(),
    });
  },

  warning(message: string, details?: unknown) {
    sendLog({
      level: "warning",
      message,
      details,
      createdAt: new Date().toISOString(),
    });
  },

  error(message: string, details?: unknown) {
    sendLog({
      level: "error",
      message,
      details,
      createdAt: new Date().toISOString(),
    });
  },
};

const sendLog = async (payload: LogPayload) => {
  try {
    if (!isProduction) {
      return;
    }

    await fetch("http://localhost:8000/frontend-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ничего не выводим в console.
  }
};