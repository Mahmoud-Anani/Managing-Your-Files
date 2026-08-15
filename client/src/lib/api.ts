import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorName?: string;

  constructor(message: string, statusCode: number, errorName?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorName = errorName;
  }
}

interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const body = axiosError.response?.data;
    const message =
      body?.message ?? (axiosError.code === "ECONNABORTED" || !axiosError.response
        ? "Unable to reach the server. Please try again."
        : "An unexpected error occurred.");
    return new ApiError(message, axiosError.response?.status ?? 500, body?.error);
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }
  return new ApiError("An unexpected error occurred.", 500);
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 30000,
  withCredentials: true,
});

export const uploadApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 120000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown): void {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401 && !axiosError.config?.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(axiosError.config!))
          .catch((err) => Promise.reject(toApiError(err)));
      }

      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(axiosError.config!);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(toApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  },
);

uploadApi.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401 && !axiosError.config?.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => uploadApi(axiosError.config!))
          .catch((err) => Promise.reject(toApiError(err)));
      }

      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return uploadApi(axiosError.config!);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(toApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function fetchFileBlob(
  fileId: string,
  mode: "download" | "preview",
): Promise<Blob> {
  const { data } = await api.get<Blob>(`/files/${fileId}/${mode}`, {
    responseType: "blob",
  });
  return data;
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPdfMime(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isTextPreviewable(mimeType: string, extension: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    ["json", "xml", "log", "csv", "md"].includes(extension.toLowerCase())
  );
}
