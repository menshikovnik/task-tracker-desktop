import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Priority,
  Status,
  Task,
  createTask,
  deleteTask,
  getAllTasksPaginated,
  loginUser,
  logoutUser,
  patchTask,
  registerUser,
  setAccessToken,
  updateTask,
} from "./api";
import { EMPTY_TASK_FORM, PRIORITY_ORDER } from "./app/constants";
import { AppFeedback, AuthMode, TaskFilter, TaskFormState } from "./app/types";
import "./App.css";
import { useAuth } from "./auth";
import { AuthScreen } from "./components/AuthScreen";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { FeedbackToast } from "./components/FeedbackToast";
import { NewTaskModal } from "./components/NewTaskModal";
import { Sidebar } from "./components/Sidebar";
import { TaskContextMenu } from "./components/TaskContextMenu";
import { TaskDetailView } from "./components/TaskDetailView";
import { TaskListView } from "./components/TaskListView";

function App() {
  const { user, setUser, clearUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("ALL");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalClosing, setTaskModalClosing] = useState(false);
  const [taskCreateSuccess, setTaskCreateSuccess] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<number | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    taskId: number;
    x: number;
    y: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const [feedbackClosing, setFeedbackClosing] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [detailDraft, setDetailDraft] = useState({
    title: "",
    description: "",
  });
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setSelectedTaskId(null);
      return;
    }

    void loadTasks();
  }, [user, activeFilter]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isNewShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n";
      if (!isNewShortcut || !user) {
        return;
      }

      event.preventDefault();
      openTaskModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  useEffect(() => {
    if (!taskModalClosing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTaskModalClosing(false);
      setTaskModalOpen(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [taskModalClosing]);

  useEffect(() => {
    if (!taskCreateSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTaskCreateSuccess(false);
      setTaskModalClosing(true);
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [taskCreateSuccess]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissFeedback();
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!feedbackClosing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
      setFeedbackClosing(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackClosing]);

  useEffect(() => {
    if (!createdTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCreatedTaskId(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [createdTaskId]);

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  useEffect(() => {
    if (!selectedTask) {
      setDetailDraft({ title: "", description: "" });
      return;
    }

    setDetailDraft({
      title: selectedTask.title,
      description: selectedTask.description,
    });
  }, [selectedTask]);

  useEffect(() => {
    if (!descriptionTextareaRef.current) {
      return;
    }

    descriptionTextareaRef.current.style.height = "auto";
    descriptionTextareaRef.current.style.height = `${descriptionTextareaRef.current.scrollHeight}px`;
  }, [detailDraft.description]);

  const groupedTasks = useMemo(() => {
    return PRIORITY_ORDER.map((priority) => ({
      priority,
      tasks: tasks.filter((task) => task.priority === priority),
    })).filter((group) => group.tasks.length > 0);
  }, [tasks]);

  async function loadTasks() {
    setTaskLoading(true);
    setFeedback(null);

    try {
      const status =
        activeFilter === "OPEN" ||
        activeFilter === "IN_PROGRESS" ||
        activeFilter === "DONE" ||
        activeFilter === "CANCELLED"
          ? activeFilter
          : undefined;
      const priority = activeFilter === "HIGH_PRIORITY" ? "HIGH" : undefined;

      const taskList = await getAllTasksPaginated({ status, priority });
      setTasks(taskList);
      setSelectedTaskId((currentId) => {
        if (currentId && taskList.some((task) => task.id === currentId)) {
          return currentId;
        }

        return taskList[0]?.id ?? null;
      });
      if (taskList.length === 0) {
        setView("list");
      }
    } catch (error) {
      handleAppError(error);
    } finally {
      setTaskLoading(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setFeedback(null);

    try {
      if (authMode === "login") {
        const response = await loginUser({
          username: authForm.username,
          password: authForm.password,
        });
        setAccessToken(response.accessToken);
      } else {
        const response = await registerUser({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword,
        });
        setAccessToken(response.accessToken);
      }

      setUser(authForm.username);
      setAuthForm({ username: "", email: "", password: "", confirmPassword: "" });
    } catch (error) {
      handleAppError(error);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      handleAppError(error);
    } finally {
      clearUser();
      setTasks([]);
      setSelectedTaskId(null);
    }
  }

  async function handleTaskCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      setFeedback({
        title: "Add a title",
        message: "Enter a short task title before creating the task.",
      });
      return;
    }

    setTaskSaving(true);
    setFeedback(null);

    try {
      const createdTask = await createTask({
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: taskForm.status,
      });

      setTaskForm(EMPTY_TASK_FORM);
      setTaskCreateSuccess(true);

      if (createdTask) {
        setTasks((currentTasks) => [createdTask, ...currentTasks]);
        setSelectedTaskId(createdTask.id);
        setCreatedTaskId(createdTask.id);
        setFeedback({
          title: "Task created",
          message: `"${createdTask.title}" is now in your queue.`,
          tone: "success",
        });
      } else {
        await loadTasks();
        setFeedback({
          title: "Task created",
          message: "Your task was created successfully.",
          tone: "success",
        });
      }
    } catch (error) {
      handleAppError(error);
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleTaskFieldUpdate(field: "status" | "priority", value: Status | Priority) {
    if (!selectedTask) {
      return;
    }

    const nextTask: Task = {
      ...selectedTask,
      [field]: value,
    } as Task;

    setDetailSaving(true);
    setFeedback(null);

    try {
      const updatedTask = await updateTask(selectedTask.id, {
        title: nextTask.title,
        description: nextTask.description,
        priority: nextTask.priority,
        status: nextTask.status,
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    } catch (error) {
      handleAppError(error);
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleQuickComplete(taskId: number) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const nextStatus: Status = task.status === "DONE" ? "OPEN" : "DONE";
    const nextTask: Task = {
      ...task,
      status: nextStatus,
    };

    const previousTasks = tasks;

    setTasks((currentTasks) =>
      currentTasks
        .map((item) => (item.id === taskId ? nextTask : item))
        .filter((item) => matchesActiveFilter(item, activeFilter)),
    );

    try {
      const updatedTask = await updateTask(taskId, {
        title: nextTask.title,
        description: nextTask.description,
        priority: nextTask.priority,
        status: nextTask.status,
      });

      setTasks((currentTasks) => {
        const merged = currentTasks.some((item) => item.id === updatedTask.id)
          ? currentTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item))
          : [...currentTasks, updatedTask];

        return merged.filter((item) => matchesActiveFilter(item, activeFilter));
      });
      setFeedback({
        title: nextStatus === "DONE" ? "Task completed" : "Task reopened",
        message:
          nextStatus === "DONE"
            ? `"${updatedTask.title}" moved to Completed.`
            : `"${updatedTask.title}" moved back to Open.`,
        tone: "success",
      });
    } catch (error) {
      setTasks(previousTasks);
      handleAppError(error);
    }
  }

  async function handleTaskDelete(taskId?: number) {
    const idToDelete = taskId ?? selectedTask?.id;
    if (!idToDelete) {
      return;
    }

    setDeleteSaving(true);
    setFeedback(null);
    setContextMenu(null);

    try {
      await deleteTask(idToDelete);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== idToDelete));
      if (selectedTaskId === idToDelete) {
        setSelectedTaskId(null);
        setView("list");
      }
    } catch (error) {
      handleAppError(error);
    } finally {
      setDeleteSaving(false);
    }
  }

  function openDeleteConfirm(taskId: number) {
    setContextMenu(null);
    setDeleteConfirmTaskId(taskId);
  }

  function closeDeleteConfirm() {
    if (!deleteSaving) {
      setDeleteConfirmTaskId(null);
    }
  }

  function openTaskModal() {
    setFeedback(null);
    setTaskCreateSuccess(false);
    setTaskModalClosing(false);
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    if (taskSaving || !taskModalOpen || taskModalClosing) {
      return;
    }

    setTaskCreateSuccess(false);
    setTaskModalClosing(true);
  }

  function handleTaskOpen(taskId: number) {
    setSelectedTaskId(taskId);
    setView("detail");
  }

  async function handleDetailBlur(field: "title" | "description") {
    if (!selectedTask) {
      return;
    }

    const nextValue = detailDraft[field].trim();
    const fallbackValue = field === "title" ? selectedTask.title : selectedTask.description;
    const resolvedValue = field === "title" && !nextValue ? fallbackValue : detailDraft[field];

    if (resolvedValue === selectedTask[field]) {
      return;
    }

    const previousTask = selectedTask;
    const updatedTask: Task = {
      ...selectedTask,
      [field]: resolvedValue,
    };

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === selectedTask.id ? updatedTask : task)),
    );
    setDetailDraft((current) => ({
      ...current,
      [field]: resolvedValue,
    }));

    setDetailSaving(true);

    try {
      const savedTask = await patchTask(selectedTask.id, {
        [field]: resolvedValue,
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === savedTask.id ? savedTask : task)),
      );
      setDetailDraft({
        title: savedTask.title,
        description: savedTask.description,
      });
    } catch (error) {
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === previousTask.id ? previousTask : task)),
      );
      setDetailDraft({
        title: previousTask.title,
        description: previousTask.description,
      });
      handleAppError(error);
    } finally {
      setDetailSaving(false);
    }
  }

  function handleAppError(error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        setAccessToken(null);
        clearUser();
        setTasks([]);
        setSelectedTaskId(null);
        setFeedback({
          title: "Session expired",
          message: "Please sign in again to continue working.",
          tone: "error",
        });
        return;
      }

      const message = error.message.toLowerCase();

      if (message.includes("cannot reach backend")) {
        setFeedback({
          title: "Can't connect to the server",
          message: "Make sure the Spring backend is running and reachable from the app.",
          tone: "error",
        });
        return;
      }

      if (message.includes("bad credentials") || message.includes("invalid")) {
        setFeedback({
          title: "Sign in failed",
          message: "Check your username and password and try again.",
          tone: "error",
        });
        return;
      }

      if (message.includes("403")) {
        setFeedback({
          title: "Access denied",
          message: "You don't have permission to perform this action.",
          tone: "error",
        });
        return;
      }

      if (message.includes("404")) {
        setFeedback({
          title: "Not found",
          message: "That item could not be found.",
          tone: "error",
        });
        return;
      }

      setFeedback({
        title: "Something went wrong",
        message: error.message,
        tone: "error",
      });
      return;
    }

    setFeedback({
      title: "Something went wrong",
      message: "Please try again.",
      tone: "error",
    });
  }

  function dismissFeedback() {
    if (!feedback || feedbackClosing) {
      return;
    }

    setFeedbackClosing(true);
  }

  function handleTaskFormChange<K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) {
    setTaskForm((current) => ({ ...current, [field]: value }));
  }

  function handleAuthFormChange(
    field: "username" | "email" | "password" | "confirmPassword",
    value: string,
  ) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  function handleDetailDraftChange(field: "title" | "description", value: string) {
    setDetailDraft((current) => ({ ...current, [field]: value }));
  }

  if (!user) {
    return (
      <>
        {feedback ? (
          <FeedbackToast closing={feedbackClosing} feedback={feedback} onDismiss={dismissFeedback} />
        ) : null}
        <AuthScreen
          authForm={authForm}
          authLoading={authLoading}
          authMode={authMode}
          onAuthFormChange={handleAuthFormChange}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
        />
      </>
    );
  }

  return (
    <>
      {feedback ? (
        <FeedbackToast closing={feedbackClosing} feedback={feedback} onDismiss={dismissFeedback} />
      ) : null}
      <main className="app-shell">
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onLogout={() => void handleLogout()}
          user={user}
        />

        {view === "list" ? (
          <TaskListView
            activeFilter={activeFilter}
            createdTaskId={createdTaskId}
            groupedTasks={groupedTasks}
            hoveredTaskId={hoveredTaskId}
            onFilterChange={setActiveFilter}
            onHoverChange={setHoveredTaskId}
            onOpenContextMenu={(taskId, x, y) => setContextMenu({ taskId, x, y })}
            onOpenTask={handleTaskOpen}
            onOpenTaskModal={openTaskModal}
            onQuickComplete={(taskId) => void handleQuickComplete(taskId)}
            taskLoading={taskLoading}
          />
        ) : (
          <TaskDetailView
            deleteSaving={deleteSaving}
            descriptionTextareaRef={descriptionTextareaRef}
            detailDraft={detailDraft}
            detailSaving={detailSaving}
            onBack={() => setView("list")}
            onDelete={() => {
              if (selectedTask) {
                openDeleteConfirm(selectedTask.id);
              }
            }}
            onDetailBlur={(field) => void handleDetailBlur(field)}
            onDetailDraftChange={handleDetailDraftChange}
            onTaskFieldUpdate={(field, value) => void handleTaskFieldUpdate(field, value)}
            selectedTask={selectedTask}
          />
        )}
      </main>

      <NewTaskModal
        closing={taskModalClosing}
        onClose={closeTaskModal}
        onSubmit={handleTaskCreate}
        onTaskFormChange={handleTaskFormChange}
        open={taskModalOpen}
        taskForm={taskForm}
        taskCreateSuccess={taskCreateSuccess}
        taskSaving={taskSaving}
      />

      <TaskContextMenu
        contextMenu={contextMenu}
        deleteSaving={deleteSaving}
        onDelete={openDeleteConfirm}
      />

      <DeleteConfirmModal
        deleteSaving={deleteSaving}
        onCancel={closeDeleteConfirm}
        onConfirm={async () => {
          await handleTaskDelete(deleteConfirmTaskId ?? undefined);
          setDeleteConfirmTaskId(null);
        }}
        open={deleteConfirmTaskId !== null}
      />
    </>
  );
}

export default App;

function matchesActiveFilter(task: Task, activeFilter: TaskFilter) {
  switch (activeFilter) {
    case "OPEN":
    case "IN_PROGRESS":
    case "DONE":
    case "CANCELLED":
      return task.status === activeFilter;
    case "HIGH_PRIORITY":
      return task.priority === "HIGH";
    case "ALL":
    default:
      return true;
  }
}
