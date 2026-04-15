import axios, { AxiosError } from "axios";

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface Task {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  status: Status;
  priority: Priority;
  creatorId: number;
  projectId?: number | null;
  dueDate?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalPages: number;
  number: number;
  size: number;
  totalElements?: number;
}

type AuthResponse = {
  accessToken: string;
};

type LoginPayload =
  | {
      username: string;
      password: string;
      email?: never;
    }
  | {
      email: string;
      password: string;
      username?: never;
    };

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};
type RegistrationPayload = RegisterPayload & {
  confirmPassword: string;
};

const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8080/api";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";

let accessToken =
  typeof window !== "undefined" ? window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) : null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function restoreAccessToken() {
  return accessToken;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "API-Version": "1.0",
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers["API-Version"] = "1.0";
  config.withCredentials = true;

  const requestUrl = typeof config.url === "string" ? config.url : "";
  const isRefreshRequest = requestUrl.includes("/auth/refresh");

  if (accessToken && !config.headers.Authorization && !isRefreshRequest) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const path = originalRequest?.url ?? "";

    if ((status !== 401 && status !== 403) || !originalRequest || (originalRequest as { _retry?: boolean })._retry) {
      throw normalizeApiError(error);
    }

    if (path.includes("/auth/login") || path.includes("/auth/register") || path.includes("/auth/refresh")) {
      throw normalizeApiError(error);
    }

    (originalRequest as { _retry?: boolean })._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const refreshedToken = await refreshPromise;
    if (!refreshedToken) {
      throw new Error("UNAUTHORIZED");
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;

    return apiClient.request(originalRequest);
  },
);

export async function loginUser(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function registerUser(payload: RegistrationPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refreshAccessToken() {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/refresh");
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function bootstrapSession() {
  return refreshAccessToken();
}

export async function logoutUser() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export function normalizeApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return new Error("UNAUTHORIZED");
    }

    if (!error.response) {
      return new Error("Cannot reach backend. Check that Spring is running on http://localhost:8080.");
    }

    const responseData = error.response.data;
    if (typeof responseData === "string" && responseData.trim()) {
      return new Error(responseData);
    }

    return new Error(`Request failed with status ${error.response.status}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Something went wrong");
}

export function extractCreatedIdFromLocation(location?: string | null) {
  if (!location) {
    return null;
  }

  const match = location.match(/\/(\d+)(?:\/)?$/);
  return match ? Number(match[1]) : null;
}
