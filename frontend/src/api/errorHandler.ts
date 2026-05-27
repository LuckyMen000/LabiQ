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
    statusCode: number = 500,
    code: string = "UNKNOWN_ERROR",
    details: unknown = {}
  ) {
    super(message);

    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла неизвестная ошибка";
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");

  const isJson = contentType?.includes("application/json");

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new ApiClientError(
      errorData?.message || "Ошибка запроса",
      response.status,
      errorData?.code || "REQUEST_ERROR",
      errorData?.details || {}
    );
  }

  return data as T;
};