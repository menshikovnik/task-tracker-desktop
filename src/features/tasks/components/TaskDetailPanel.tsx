import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Expand, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Project, Task } from "../../../api";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";
import { useDeleteTask } from "../hooks/useDeleteTask";
import { useDebouncedTaskPatch } from "../hooks/useDebouncedTaskPatch";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

const STATUS_OPTIONS: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
const PRIORITY_OPTIONS: Task["priority"][] = ["LOW", "MEDIUM", "HIGH"];

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusDot(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />;
    case "DONE":
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />;
    case "CANCELLED":
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-500" />;
    case "OPEN":
    default:
      return <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/30" />;
  }
}

function priorityDot(priority: Task["priority"]) {
  switch (priority) {
    case "HIGH":
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />;
    case "MEDIUM":
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />;
    case "LOW":
    default:
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />;
  }
}

function autosizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

type ToastHandler = (toast: { title: string; message: string; tone?: "error" | "success" }) => void;

export function TaskDetailPanel({
  task,
  open,
  mounted,
  projects,
  onClose,
  onToast,
}: {
  task: Task | null;
  open: boolean;
  mounted: boolean;
  projects: Project[];
  onClose: () => void;
  onToast: ToastHandler;
}) {
  const navigate = useNavigate();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("OPEN");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [savedVisible, setSavedVisible] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const savedTimeoutRef = useRef<number | null>(null);

  const currentTask = task;
  const currentProject = useMemo(
    () =>
      currentTask?.projectId
        ? projects.find((project) => project.id === currentTask.projectId) ?? null
        : null,
    [currentTask, projects],
  );

  const { flushSave, scheduleSave } = useDebouncedTaskPatch(currentTask?.id ?? 0, {
    onSaved: () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
      setSavedVisible(true);
      savedTimeoutRef.current = window.setTimeout(() => {
        setSavedVisible(false);
      }, 1200);
    },
    onError: () => {
      onToast({
        title: "Failed to save",
        message: "Your latest task changes could not be saved.",
        tone: "error",
      });
    },
  });

  useEffect(() => {
    if (!currentTask) {
      return;
    }

    setTitle(currentTask.title);
    setDescription(currentTask.description ?? "");
    setStatus(currentTask.status);
    setPriority(currentTask.priority);
    setDueDate(toDateInputValue(currentTask.dueDate));
    setConfirmDeleteOpen(false);
  }, [currentTask]);

  useEffect(() => {
    autosizeTextarea(titleRef.current);
  }, [title]);

  useEffect(() => {
    autosizeTextarea(descriptionRef.current);
  }, [description]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted || !currentTask) {
    return null;
  }

  const taskItem = currentTask;

  async function handleDeleteConfirm() {
    await deleteTask.mutateAsync(taskItem.id);
    setConfirmDeleteOpen(false);
    onClose();
    onToast({
      title: "Task deleted",
      message: "The task was removed from your workspace.",
      tone: "success",
    });
  }

  function openFullView() {
    const fullViewPath = currentProject
      ? `/projects/${currentProject.id}/tasks/${taskItem.id}`
      : `/tasks/${taskItem.id}`;

    onClose();
    window.setTimeout(() => {
      navigate(fullViewPath);
    }, 220);
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-30 bg-black/40 transition-[opacity,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "pointer-events-auto opacity-100 backdrop-blur-[2px]"
            : "pointer-events-none opacity-0 backdrop-blur-0",
        ].join(" ")}
        onClick={onClose}
        role="presentation"
      />

      <aside
        className={[
          "fixed right-0 top-0 z-40 h-screen w-[400px] border-l border-white/[0.07] bg-[#0e0e1c] shadow-2xl transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          open
            ? "translate-x-0 opacity-100 blur-0"
            : "translate-x-[104%] opacity-0 blur-[8px]",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div
            className={[
              "sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0e0e1c]/95 px-5 py-4 backdrop-blur-xl transition-[transform,opacity] duration-300 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                FLUX-{taskItem.id}
              </span>
              <span
                className={[
                  "text-xs text-emerald-400 transition-opacity duration-300",
                  savedVisible ? "opacity-100" : "opacity-0",
                ].join(" ")}
              >
                Saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                onClick={openFullView}
                type="button"
              >
                <Expand size={16} />
              </button>
              <button
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:border-red-500/35 hover:bg-red-500/16 hover:text-red-300"
                onClick={() => setConfirmDeleteOpen(true)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                onClick={onClose}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className={[
              "task-detail-scroll flex-1 overflow-y-auto px-5 py-5 transition-[transform,opacity] duration-300 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            ].join(" ")}
          >
            <textarea
              className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-[18px] font-semibold leading-7 text-white outline-none"
              onBlur={() => {
                if (title.trim() && title !== currentTask.title) {
                  void flushSave("title", { title: title.trim() });
                }
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setTitle(nextValue);
                if (nextValue.trim()) {
                  scheduleSave("title", { title: nextValue.trim() });
                }
              }}
              ref={titleRef}
              rows={1}
              value={title}
            />

            <textarea
              className="mt-4 min-h-[132px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[13.5px] leading-6 text-white/80 outline-none placeholder:text-white/25"
              onBlur={() => {
                if (description !== (currentTask.description ?? "")) {
                  void flushSave("description", { description });
                }
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setDescription(nextValue);
                scheduleSave("description", { description: nextValue });
              }}
              placeholder="Add a description..."
              ref={descriptionRef}
              rows={4}
              value={description}
            />

            <div className="my-5 h-px bg-white/[0.07]" />

            <div className="grid gap-4">
              <PropertyRow label="Status">
                <CustomSelect
                  onChange={(value) => {
                    const nextStatus = value as Task["status"];
                    setStatus(nextStatus);
                    scheduleSave("status", { status: nextStatus });
                  }}
                  options={STATUS_OPTIONS.map((option) => ({
                    value: option,
                    label: option.replace("_", " "),
                    leading: statusDot(option),
                  }))}
                  menuClassName="min-w-[188px]"
                  value={status}
                />
              </PropertyRow>

              <PropertyRow label="Priority">
                <CustomSelect
                  onChange={(value) => {
                    const nextPriority = value as Task["priority"];
                    setPriority(nextPriority);
                    scheduleSave("priority", { priority: nextPriority });
                  }}
                  options={PRIORITY_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                    leading: priorityDot(option),
                  }))}
                  value={priority}
                />
              </PropertyRow>

              <PropertyRow label="Due date">
                <CustomDateInput
                  compact
                  onChange={(value) => {
                    setDueDate(value);
                    const nextValue = value ? new Date(`${value}T00:00:00`).toISOString() : null;
                    scheduleSave("dueDate", { dueDate: nextValue });
                  }}
                  align="right"
                  value={dueDate}
                />
              </PropertyRow>

              <PropertyRow label="Project">
                {currentProject ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-xs text-white/75">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentProject.color || "#888888" }}
                    />
                    {currentProject.name}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-xs text-white/45">
                    No project
                  </span>
                )}
              </PropertyRow>

              <PropertyRow label="Created">
                <span className="text-sm text-white/55">{formatCreatedAt(currentTask.createdAt)}</span>
              </PropertyRow>
            </div>
          </div>
        </div>
      </aside>

      <ConfirmDeleteModal
        loading={deleteTask.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        open={confirmDeleteOpen}
      />
    </>
  );
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-4">
      <span className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</span>
      <div>{children}</div>
    </div>
  );
}
