import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { frontendLogger } from "../utils/frontendLogger";

const API_BASE_URL = "http://localhost:8000";

export type ApiErrorResponse = {
  status?: string;
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details: unknown = {}
  ) {
    super(message);

    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const buildCorrelationId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");

    const correlationId = buildCorrelationId();

    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    config.headers.set("X-Correlation-ID", correlationId);

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error: AxiosError) => {
    frontendLogger.error("Ошибка подготовки API-запроса", {
      message: error.message,
    });

    return Promise.reject(
      new ApiClientError(
        "Не удалось подготовить запрос",
        0,
        "REQUEST_SETUP_ERROR",
        {}
      )
    );
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const statusCode = error.response?.status || 0;
    const responseData = error.response?.data;

    const apiError = new ApiClientError(
      responseData?.message ||
        (statusCode === 0
          ? "Ошибка соединения с сервером"
          : "Ошибка запроса"),
      statusCode,
      responseData?.code || (statusCode === 0 ? "NETWORK_ERROR" : "REQUEST_ERROR"),
      responseData?.details || {}
    );

    frontendLogger.error("Ошибка API-запроса", {
      url: error.config?.url,
      method: error.config?.method,
      statusCode: apiError.statusCode,
      code: apiError.code,
      message: apiError.message,
    });

    if (statusCode === 401) {
      logout();
    }

    return Promise.reject(apiError);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || "Ошибка запроса";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла неизвестная ошибка";
};

export default api;