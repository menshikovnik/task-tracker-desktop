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
}

interface AuthResponse {
  accessToken: string;
}

interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalPages: number;
  number: number;
  size: number;
}

type TaskQuery = {
  page?: number;
  size?: number;
  status?: Status;
  priority?: Priority;
};

type AuthPayload = {
  username: string;
  password: string;
};

type RegisterPayload = AuthPayload & {
  email: string;
  confirmPassword: string;
};

type TaskPayload = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
};

type UpdateTaskPayload = Partial<TaskPayload>;

const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8080/api";
const ACCESS_TOKEN_STORAGE_KEY = "task-tracker-access-token";

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

async function apiFetch<T>(path: string, init?: RequestInit, allowRefresh = true): Promise<T> {
  let response: Response;
  const currentOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "unknown";
  const headers = new Headers(init?.headers);

  headers.set("API-Version", "1.0");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach backend. Check that Spring is running on http://localhost:8080 and that CORS allows origin ${currentOrigin}.`,
      );
    }

    throw error;
  }

  if (response.status === 401) {
    if (allowRefresh && shouldAttemptRefresh(path)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, init, false);
      }
    }

    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

function shouldAttemptRefresh(path: string) {
  return !path.startsWith("/auth/login") && !path.startsWith("/auth/register") && !path.startsWith("/auth/refresh");
}

export async function refreshAccessToken() {
  try {
    const response = await apiFetch<AuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
      },
      false,
    );
    setAccessToken(response.accessToken);
    return response.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function loginUser(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload: RegisterPayload) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser() {
  try {
    await apiFetch<void>("/auth/logout", {
      method: "POST",
    }, false);
  } finally {
    setAccessToken(null);
  }
}

export function restoreAccessToken() {
  return accessToken;
}

export function getTasks({ page = 0, size = 50, status, priority }: TaskQuery = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (status) {
    searchParams.set("status", status);
  }

  if (priority) {
    searchParams.set("priority", priority);
  }

  return apiFetch<PageResponse<Task>>(`/tasks?${searchParams.toString()}`);
}

export async function getAllTasksPaginated(
  { status, priority }: Pick<TaskQuery, "status" | "priority"> = {},
  size = 50,
) {
  const allTasks: Task[] = [];
  let page = 0;

  while (true) {
    const response = await getTasks({ page, size, status, priority });
    allTasks.push(...response.content);

    if (response.last || response.content.length === 0 || page >= response.totalPages - 1) {
      return allTasks;
    }

    page += 1;
  }
}

export function getTask(id: number) {
  return apiFetch<Task>(`/tasks/${id}`);
}

export function createTask(payload: TaskPayload) {
  return apiFetch<Task | undefined>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(id: number, payload: TaskPayload) {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function patchTask(id: number, payload: UpdateTaskPayload) {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id: number) {
  return apiFetch<void>(`/tasks/${id}`, {
    method: "DELETE",
  });
}
