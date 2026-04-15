import { apiClient, PageResponse, Priority, Status, Task } from "../../../api";

export type TaskFilters = {
  page?: number;
  size?: number;
  projectId?: number;
  status?: Status;
  priority?: Priority;
};

export type CreateTaskPayload = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  projectId: number | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload & { dueDate: string | null }>;

export async function getTasks({ page = 0, size = 100, projectId, status, priority }: TaskFilters = {}) {
  const response = await apiClient.get<PageResponse<Task>>("/tasks", {
    params: {
      page,
      size,
      ...(projectId !== undefined ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
  });

  return response.data;
}

export async function getAllTasks(filters: Omit<TaskFilters, "page"> = {}) {
  const allTasks: Task[] = [];
  let page = 0;

  while (true) {
    const response = await getTasks({ ...filters, page });
    allTasks.push(...response.content);

    if (response.last || response.content.length === 0 || page >= response.totalPages - 1) {
      return allTasks;
    }

    page += 1;
  }
}

export async function createTask(payload: CreateTaskPayload) {
  const response = await apiClient.post<Task>("/tasks", {
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    projectId: payload.projectId,
  });
  return response.data;
}

export async function getTask(id: number) {
  const response = await apiClient.get<Task>(`/tasks/${id}`);
  return response.data;
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, payload);
  return response.data;
}

export async function deleteTask(id: number) {
  await apiClient.delete(`/tasks/${id}`);
}
