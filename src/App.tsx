import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Project, Task, logoutUser, normalizeApiError, setAccessToken } from "./api";
import "./App.css";
import { useAuth } from "./auth";
import { AuthPage } from "./components/AuthPage";
import { NewProjectModal } from "./features/projects/components/NewProjectModal";
import { ProjectStatsBar } from "./features/projects/components/ProjectStatsBar";
import { ProjectTopbar } from "./features/projects/components/ProjectTopbar";
import { useCreateProject } from "./features/projects/hooks/useCreateProject";
import { useDeleteProject } from "./features/projects/hooks/useDeleteProject";
import { useProject } from "./features/projects/hooks/useProject";
import { useProjects } from "./features/projects/hooks/useProjects";
import { ConfirmDeleteModal } from "./features/tasks/components/ConfirmDeleteModal";
import { NewTaskModal } from "./features/tasks/components/NewTaskModal";
import { TaskList } from "./features/tasks/components/TaskList";
import { TaskFullView } from "./features/tasks/components/TaskFullView";
import { getAllTasks } from "./features/tasks/api/tasksApi";
import { useCreateTask } from "./features/tasks/hooks/useCreateTask";
import { useTasks } from "./features/tasks/hooks/useTasks";
import { AppLayout } from "./layout/AppLayout";
import { Sidebar } from "./layout/Sidebar";

type Notice = {
  title: string;
  message: string;
  tone?: "error" | "success";
};

function isToday(dateString?: string | null) {
  if (!dateString) {
    return false;
  }

  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const statusOrder: Record<Task["status"], number> = {
      IN_PROGRESS: 0,
      OPEN: 1,
      DONE: 2,
      CANCELLED: 3,
    };

    return (
      statusOrder[left.status] - statusOrder[right.status] ||
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-10 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-white/35">{label}</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Coming soon</h2>
        <p className="mt-2 max-w-md text-sm text-white/50">
          {label} view is not implemented yet, but the navigation is already in place.
        </p>
      </div>
    </div>
  );
}

function WorkspaceView({
  allProjects,
  onOpenTask,
  onOpenTaskModal,
  onToast,
}: {
  allProjects: Project[];
  onOpenTask: (task: Task) => void;
  onOpenTaskModal: (projectId?: number) => void;
  onToast: (toast: Notice) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "timeline">("list");
  const tabsRef = useRef<Record<"list" | "board" | "timeline", HTMLButtonElement | null>>({
    list: null,
    board: null,
    timeline: null,
  });
  const tabsRailRef = useRef<HTMLDivElement | null>(null);
  const [tabUnderline, setTabUnderline] = useState({ width: 0, x: 0, opacity: 0 });
  const projectIdParam = useParams().projectId;
  const projectId = projectIdParam ? Number(projectIdParam) : null;
  const todayMode = searchParams.get("view") === "today";
  const projectQuery = useProject(projectId);
  const project = projectId
    ? projectQuery.data ?? allProjects.find((item) => item.id === projectId) ?? null
    : null;

  const taskQuery = useTasks(projectId ? { projectId } : {});
  const deleteProject = useDeleteProject();
  const rawTasks = useMemo(() => taskQuery.data ?? [], [taskQuery.data]);
  const scopedTasks = useMemo(() => {
    if (todayMode && projectId === null) {
      return rawTasks.filter((task) => isToday(task.dueDate));
    }

    return rawTasks;
  }, [projectId, rawTasks, todayMode]);
  const tasks = useMemo(() => sortTasks(scopedTasks), [scopedTasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      open: tasks.filter((task) => task.status === "OPEN").length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      done: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  const title = project ? project.name : todayMode ? "Today" : "My tasks";
  const subtitle = project
    ? `${tasks.length} tasks in this workspace`
    : todayMode
      ? "Tasks due today across all projects"
      : "Everything across all projects";

  useLayoutEffect(() => {
    const activeButton = tabsRef.current[activeTab];
    const rail = tabsRailRef.current;

    if (!activeButton || !rail) {
      return;
    }

    setTabUnderline({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft,
      opacity: 1,
    });
  }, [activeTab]);

  if (projectId !== null && !project && !taskQuery.isLoading && !projectQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-10 text-center">
          <h2 className="text-2xl font-semibold text-white">Project not found</h2>
          <p className="mt-2 text-sm text-white/50">This project may have been archived or removed.</p>
        </div>
      </div>
    );
  }

  function handleOpenTask(task: Task) {
    if (projectId !== null) {
      onOpenTask({ ...task, projectId });
      return;
    }

    onOpenTask(task);
  }

  async function handleDeleteProjectConfirm() {
    if (!project) {
      return;
    }

    try {
      const projectName = project.name;
      await deleteProject.mutateAsync(project.id);
      setDeleteConfirmOpen(false);
      navigate("/tasks", { replace: true });
      onToast({
        title: "Project deleted",
        message: `${projectName} was removed.`,
        tone: "success",
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      onToast({
        title: "Couldn't delete project",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ProjectTopbar
        color={project?.color}
        deleteProjectLoading={deleteProject.isPending}
        isProjectView={Boolean(project)}
        onCreateTask={() => onOpenTaskModal(project?.id)}
        onDeleteProject={project ? () => setDeleteConfirmOpen(true) : undefined}
        subtitle={subtitle}
        title={title}
      />

      <div className="border-b border-white/10 px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="tab-strip relative inline-flex" ref={tabsRailRef}>
            <span
              className="tab-strip__underline absolute bottom-0 h-0.5 rounded-full bg-[#6C63FF] transition-[transform,width,opacity] duration-300 ease-out"
              style={{
                width: `${tabUnderline.width}px`,
                transform: `translateX(${tabUnderline.x}px)`,
                opacity: tabUnderline.opacity,
              }}
            />
            {(["list", "board", "timeline"] as const).map((tab) => (
              <button
                className={[
                  "relative z-10 px-3 py-2 text-sm transition-colors",
                  activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70",
                ].join(" ")}
                key={tab}
                onClick={() => setActiveTab(tab)}
                ref={(node) => {
                  tabsRef.current[tab] = node;
                }}
                type="button"
              >
                {tab === "list" ? "List" : tab === "board" ? "Board" : "Timeline"}
              </button>
            ))}
          </div>

          {todayMode ? (
            <button
              className="text-xs text-white/35 transition hover:text-white/65"
              onClick={() => setSearchParams({})}
              type="button"
            >
              Exit Today view
            </button>
          ) : <span />}
        </div>
      </div>

      <ProjectStatsBar done={stats.done} inProgress={stats.inProgress} open={stats.open} total={stats.total} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "board" ? (
          <ComingSoonPanel label="Board" />
        ) : activeTab === "timeline" ? (
          <ComingSoonPanel label="Timeline" />
        ) : (
          <TaskList
            loading={taskQuery.isLoading}
            onOpenTask={handleOpenTask}
            storageScope={projectId !== null ? `project:${projectId}` : todayMode ? "tasks:today" : "tasks:all"}
            tasks={tasks}
          />
        )}
      </div>

      <ConfirmDeleteModal
        confirmLabel="Delete project"
        loading={deleteProject.isPending}
        message={
          project
            ? `This will permanently remove "${project.name}" and refresh the workspace.`
            : "This action cannot be undone."
        }
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleDeleteProjectConfirm()}
        open={deleteConfirmOpen}
        title="Delete project?"
      />
    </div>
  );
}

function AppShell() {
  const { user, clearUser } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [closingProjectModal, setClosingProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [closingTaskModal, setClosingTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMounted, setDetailMounted] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<number | undefined>(undefined);
  const [highlightedProjectId, setHighlightedProjectId] = useState<number | null>(null);

  const projectsQuery = useProjects();
  const allTasksQuery = useTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();

  function showToast(toast: Notice) {
    setNotice(toast);
  }

  function openProjectModal() {
    setClosingProjectModal(false);
    setShowProjectModal(true);
  }

  function closeProjectModal() {
    setClosingProjectModal(true);
    window.setTimeout(() => {
      setShowProjectModal(false);
      setClosingProjectModal(false);
    }, 180);
  }

  function openTaskModal(projectId?: number) {
    setNewTaskProjectId(projectId);
    setClosingTaskModal(false);
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    setClosingTaskModal(true);
    window.setTimeout(() => {
      setShowTaskModal(false);
      setClosingTaskModal(false);
    }, 180);
  }

  function openDetail(task: Task) {
    setSelectedTask(task);
    setDetailMounted(true);
    window.requestAnimationFrame(() => {
      setDetailOpen(true);
    });
  }

  function closeDetail() {
    setDetailOpen(false);
    window.setTimeout(() => {
      setDetailMounted(false);
      setSelectedTask(null);
    }, 300);
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Ignore logout errors and clear local session anyway.
    } finally {
      setAccessToken(null);
      clearUser();
      navigate("/");
    }
  }

  async function handleCreateProject(values: { name: string; description: string; color: string }) {
    try {
      const project = await createProject.mutateAsync(values);
      setHighlightedProjectId(project.id);
      closeProjectModal();
      window.setTimeout(() => {
        navigate(`/projects/${project.id}`);
        setNotice({
          title: "Project created",
          message: `${project.name} is ready.`,
          tone: "success",
        });
      }, 180);
      window.setTimeout(() => {
        setHighlightedProjectId((current) => (current === project.id ? null : current));
      }, 1200);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setNotice({
        title: "Couldn't create project",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  async function handleCreateTask(values: {
    title: string;
    description: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate: string | null;
    projectId: number | null;
  }) {
    try {
      await createTask.mutateAsync(values);
      closeTaskModal();
      window.setTimeout(() => {
        setNotice({
          title: "Task created",
          message: `${values.title} was added to your queue.`,
          tone: "success",
        });
      }, 180);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setNotice({
        title: "Couldn't create task",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  const projects = projectsQuery.data ?? [];
  const allTasks = allTasksQuery.data ?? [];
  const projectTaskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["tasks", { projectId: project.id }],
      queryFn: () => getAllTasks({ projectId: project.id }),
      staleTime: 15_000,
    })),
  });
  const projectTaskCounts = useMemo(() => {
    return projects.reduce<Record<number, number>>((counts, project, index) => {
      const projectTasks = projectTaskQueries[index]?.data;
      if (projectTasks) {
        counts[project.id] = projectTasks.length;
        return counts;
      }

      counts[project.id] = allTasks.filter((task) => task.projectId === project.id).length;
      return counts;
    }, {});
  }, [allTasks, projectTaskQueries, projects]);

  return (
    <>
      <Routes>
        <Route element={<AuthPage />} path="/auth" />
        <Route
          element={
            <AppLayout
              detailOpen={detailOpen}
              detailMounted={detailMounted}
              onCloseDetail={closeDetail}
              onToast={showToast}
              projects={projects}
              selectedTask={selectedTask}
              sidebar={
                <Sidebar
                  allTasks={allTasks}
                  onLogout={() => void handleLogout()}
                  onOpenNewProject={openProjectModal}
                  onToggleArchived={() => setShowArchived((current) => !current)}
                  projectTaskCounts={projectTaskCounts}
                  projects={projects}
                  showArchived={showArchived}
                  user={user ?? "Workspace"}
                  highlightedProjectId={highlightedProjectId}
                />
              }
            >
              <Routes>
                <Route element={<Navigate replace to="/tasks" />} path="/" />
                <Route
                  element={
                    <WorkspaceView
                      allProjects={projects}
                      onOpenTask={openDetail}
                      onOpenTaskModal={openTaskModal}
                      onToast={showToast}
                    />
                  }
                  path="/tasks"
                />
                <Route element={<TaskFullView onToast={showToast} />} path="/tasks/:taskId" />
                <Route element={<TaskFullView onToast={showToast} />} path="/projects/:projectId/tasks/:taskId" />
                <Route
                  element={
                    <WorkspaceView
                      allProjects={projects}
                      onOpenTask={openDetail}
                      onOpenTaskModal={openTaskModal}
                      onToast={showToast}
                    />
                  }
                  path="/projects/:projectId"
                />
              </Routes>
            </AppLayout>
          }
          path="*"
        />
      </Routes>

      <NewProjectModal
        closing={closingProjectModal}
        loading={createProject.isPending}
        onClose={closeProjectModal}
        onSubmit={handleCreateProject}
        open={showProjectModal}
      />

      <NewTaskModal
        closing={closingTaskModal}
        initialProjectId={newTaskProjectId}
        loading={createTask.isPending}
        onClose={closeTaskModal}
        onSubmit={handleCreateTask}
        open={showTaskModal}
        projects={projects}
      />

      {notice ? <Toast notice={notice} onDismiss={() => setNotice(null)} /> : null}
    </>
  );
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border border-white/10 bg-[#171728] px-4 py-3 shadow-2xl">
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-1 h-2.5 w-2.5 rounded-full",
            notice.tone === "error" ? "bg-red-400" : "bg-emerald-400",
          ].join(" ")}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{notice.title}</p>
          <p className="mt-1 text-sm text-white/55">{notice.message}</p>
        </div>
        <button className="text-sm text-white/40 hover:text-white" onClick={onDismiss} type="button">
          x
        </button>
      </div>
    </div>
  );
}

export default AppShell;
