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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const currentOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "unknown";

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "API-Version": "1.0",
        "Content-Type": "application/json",
        ...init?.headers,
      },
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

export function loginUser(payload: AuthPayload) {
  return apiFetch<void>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload: RegisterPayload) {
  return apiFetch<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  });
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

export async function updateTask(id: number, payload: TaskPayload) {
  try {
    return await apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("405")) {
      return apiFetch<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }

    throw error;
  }
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
