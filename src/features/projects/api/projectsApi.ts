import { apiClient, extractCreatedIdFromLocation, PageResponse, Project } from "../../../api";

export type ProjectsQuery = {
  page?: number;
  size?: number;
  archived?: boolean;
};

export type CreateProjectPayload = {
  name: string;
  description?: string | null;
  color?: string | null;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload & { archived: boolean }>;

type ProjectResponse = Omit<Project, "archived"> & {
  archived?: boolean;
  isArchived?: boolean;
};

function normalizeProject(project: ProjectResponse): Project {
  return {
    ...project,
    description: project.description ?? null,
    color: project.color ?? null,
    archived: project.archived ?? project.isArchived ?? false,
  };
}

export async function getProjects({ page = 0, size = 100, archived }: ProjectsQuery = {}) {
  const response = await apiClient.get<PageResponse<ProjectResponse>>("/projects", {
    params: {
      page,
      size,
      ...(archived !== undefined ? { archived } : {}),
    },
  });

  return {
    ...response.data,
    content: response.data.content.map(normalizeProject),
  };
}

export async function getAllProjects() {
  const allProjects: Project[] = [];
  let page = 0;

  while (true) {
    const response = await getProjects({ page });
    allProjects.push(...response.content);

    if (response.last || response.content.length === 0 || page >= response.totalPages - 1) {
      return allProjects;
    }

    page += 1;
  }
}

export async function getProject(id: number) {
  const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
  return normalizeProject(response.data);
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await apiClient.post<ProjectResponse | undefined>("/projects", payload);
  const createdProject = response.data ? normalizeProject(response.data) : undefined;
  const createdId = createdProject?.id ?? extractCreatedIdFromLocation(response.headers.location);

  if (createdProject) {
    return createdProject;
  }

  if (!createdId) {
    throw new Error("Project created but no project id was returned.");
  }

  return getProject(createdId);
}

export async function updateProject(id: number, payload: UpdateProjectPayload) {
  const response = await apiClient.patch<Project>(`/projects/${id}`, payload);
  return response.data;
}

export async function deleteProject(id: number) {
  await apiClient.delete(`/projects/${id}`);
}
