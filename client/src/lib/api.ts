import axios, { AxiosError } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set once a 401-triggered refresh has already retried this request. */
    _retried?: boolean;
  }
}

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

    const config = axiosError.config;
    // Only retry-after-refresh ONCE per request. Guarding `_retried` prevents an
    // unbounded loop when a refresh succeeds (minting a fresh cookie) but the
    // retried request still 401s (e.g. account disabled / role revoked), which
    // would otherwise hammer the backend with refresh+retry forever.
    if (
      !config?._retried &&
      axiosError.response?.status === 401 &&
      !config?.url?.includes("/auth/")
    ) {
      config!._retried = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(config!))
          .catch((err) => Promise.reject(toApiError(err)));
      }

      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(config!);
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

    const uploadConfig = axiosError.config;
    if (
      !uploadConfig?._retried &&
      axiosError.response?.status === 401 &&
      !uploadConfig?.url?.includes("/auth/")
    ) {
      uploadConfig!._retried = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => uploadApi(uploadConfig!))
          .catch((err) => Promise.reject(toApiError(err)));
      }

      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return uploadApi(uploadConfig!);
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

const OFFICE_EXTENSIONS = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "rtf",
];

const OFFICE_MIME_PREFIXES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml",
  "application/vnd.oasis.opendocument",
  "application/rtf",
];

export function isTextPreviewable(mimeType: string, extension: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    ["json", "xml", "log", "csv", "md"].includes(extension.toLowerCase())
  );
}

/** Office documents are parsed server-side; their extracted text is previewed client-side. */
export function isOfficeMime(mimeType: string, extension: string): boolean {
  const ext = extension.toLowerCase();
  return (
    OFFICE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    OFFICE_EXTENSIONS.includes(ext)
  );
}

export function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function isAudioMime(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}
