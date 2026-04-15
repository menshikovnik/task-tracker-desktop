import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Ellipsis, Send, Trash2, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Task } from "../../../api";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";
import { useProjects } from "../../projects/hooks/useProjects";
import { useDeleteTask } from "../hooks/useDeleteTask";
import { useDebouncedTaskPatch } from "../hooks/useDebouncedTaskPatch";
import { useTask } from "../hooks/useTask";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

type ToastHandler = (toast: { title: string; message: string; tone?: "error" | "success" }) => void;

type Subtask = { id: number; title: string; done: boolean };
type Attachment = { id: number; name: string; size: string; ext: "pdf" | "png" | "zip" };
type ActivityItem =
  | { id: number; type: "event"; user: string; timestamp: string; oldValue: string; newValue: string; field: string }
  | { id: number; type: "comment"; user: string; timestamp: string; text: string };

const STATUS_OPTIONS: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
const PRIORITY_OPTIONS: Task["priority"][] = ["LOW", "MEDIUM", "HIGH"];

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function autosizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function priorityColors(priority: Task["priority"]) {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/10 text-red-400";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400";
    case "LOW":
    default:
      return "bg-emerald-500/10 text-emerald-400";
  }
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

function fileColor(ext: Attachment["ext"]) {
  switch (ext) {
    case "pdf":
      return "bg-red-500/15 text-red-400";
    case "png":
      return "bg-sky-500/15 text-sky-400";
    case "zip":
    default:
      return "bg-amber-500/15 text-amber-400";
  }
}

export function TaskFullView({ onToast }: { onToast: ToastHandler }) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  const routeProjectId = projectId ? Number(projectId) : null;
  const numericTaskId = taskId ? Number(taskId) : null;
  const { data: task, error, isLoading } = useTask(numericTaskId);
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("OPEN");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: 1, title: "Map panel interactions", done: true },
    { id: 2, title: "Refine keyboard shortcuts", done: false },
    { id: 3, title: "Polish loading states", done: false },
  ]);
  const [newSubtask, setNewSubtask] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: 1,
      type: "event",
      user: "N",
      timestamp: new Date().toISOString(),
      field: "status",
      oldValue: "OPEN",
      newValue: "IN_PROGRESS",
    },
    {
      id: 2,
      type: "comment",
      user: "N",
      timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      text: "We should make the task workspace feel calmer than the list view.",
    },
    {
      id: 3,
      type: "event",
      user: "N",
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      field: "priority",
      oldValue: "MEDIUM",
      newValue: "HIGH",
    },
    {
      id: 4,
      type: "event",
      user: "System",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      field: "created",
      oldValue: "Draft",
      newValue: "Task created",
    },
  ]);

  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const savedTimeoutRef = useRef<number | null>(null);

  const project = useMemo(
    () => {
      const effectiveProjectId = routeProjectId ?? task?.projectId ?? null;
      return effectiveProjectId ? projects.find((item) => item.id === effectiveProjectId) ?? null : null;
    },
    [projects, routeProjectId, task],
  );
  const parentPath = project ? `/projects/${project.id}` : "/tasks";

  const attachments = useMemo<Attachment[]>(
    () => [
      { id: 1, name: "spec-overview.pdf", size: "1.2 MB", ext: "pdf" },
      { id: 2, name: "panel-mock.png", size: "384 KB", ext: "png" },
      { id: 3, name: "desktop-assets.zip", size: "6.8 MB", ext: "zip" },
    ],
    [],
  );

  const { flushSave, scheduleSave } = useDebouncedTaskPatch(task?.id ?? 0, {
    onSaved: () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
      setSavedVisible(true);
      savedTimeoutRef.current = window.setTimeout(() => setSavedVisible(false), 1200);
    },
    onError: () =>
      onToast({
        title: "Failed to save",
        message: "Your latest task changes could not be saved.",
        tone: "error",
      }),
  });

  useEffect(() => {
    if (!task) {
      return;
    }
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(toDateInputValue(task.dueDate));
  }, [task]);

  useEffect(() => autosizeTextarea(titleRef.current), [title]);
  useEffect(() => autosizeTextarea(descriptionRef.current), [description]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading && !task) {
    return <div className="flex h-full items-center justify-center text-white/45">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-8 text-center">
          <h2 className="text-xl font-semibold text-white">Task unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            {error instanceof Error
              ? error.message
              : "We couldn't load this task right now."}
          </p>
          <button
            className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            onClick={() => navigate("/tasks")}
            type="button"
          >
            Back to tasks
          </button>
        </div>
      </div>
    );
  }

  const currentTask = task;

  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const subtaskProgress = subtasks.length === 0 ? 0 : (doneSubtasks / subtasks.length) * 100;
  const truncatedTitle =
    currentTask.title.length > 40 ? `${currentTask.title.slice(0, 40)}...` : currentTask.title;

  async function handleDelete() {
    await deleteTask.mutateAsync(currentTask.id);
    setConfirmDeleteOpen(false);
    onToast({
      title: "Task deleted",
      message: "The task was removed from your workspace.",
      tone: "success",
    });
    navigate(parentPath);
  }

  function closeWorkspace() {
    setIsClosing(true);
    window.setTimeout(() => {
      navigate(parentPath);
    }, 220);
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks((current) => [
      ...current,
      { id: Date.now(), title: newSubtask.trim(), done: false },
    ]);
    setNewSubtask("");
  }

  function addComment() {
    if (!commentDraft.trim()) return;
    setActivity((current) => [
      {
        id: Date.now(),
        type: "comment",
        user: "N",
        timestamp: new Date().toISOString(),
        text: commentDraft.trim(),
      },
      ...current,
    ]);
    setCommentDraft("");
  }

  return (
    <>
      <div
        className={[
          "task-full-view flex h-full flex-col bg-[#080811]",
          isClosing ? "task-full-view--closing" : "task-full-view--opening",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#080811]/90 px-8 py-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/35">
                <Link
                  className="inline-flex items-center gap-2 transition hover:text-white/80"
                  to={parentPath}
                >
                  {project ? (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color || "#888888" }} />
                  ) : null}
                  {project?.name ?? "My tasks"}
                </Link>
                <span>/</span>
                <span className="truncate text-white/55">{truncatedTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={["text-xs text-emerald-400 transition-opacity duration-300", savedVisible ? "opacity-100" : "opacity-0"].join(" ")}>
                Saved
              </span>
              <button className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white" onClick={() => navigator.clipboard.writeText(window.location.href)} type="button">
                <Copy size={15} />
              </button>
              <button className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 text-white/55 transition hover:bg-white/[0.05] hover:text-white" type="button">
                <Ellipsis size={15} />
              </button>
              <button className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:border-red-500/35 hover:bg-red-500/16 hover:text-red-300" onClick={() => setConfirmDeleteOpen(true)} type="button">
                <Trash2 size={15} />
              </button>
              <div className="mx-1 h-5 w-px bg-white/[0.07]" />
              <button className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 text-white/60 transition hover:bg-white/[0.05] hover:text-white" onClick={closeWorkspace} type="button">
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
            <div className="mx-auto max-w-4xl">
              <textarea
                className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent font-['Syne',sans-serif] text-[22px] font-bold leading-[1.28] text-white outline-none"
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

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="min-w-[150px]">
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
                    triggerClassName="rounded-md px-2.5 py-1.5 text-xs"
                    value={status}
                  />
                </div>

                <div className="min-w-[140px]">
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
                    triggerClassName={`rounded-md px-2.5 py-1.5 text-xs ${priorityColors(priority)}`}
                    value={priority}
                  />
                </div>

                <div className="min-w-[170px]">
                  <CustomDateInput
                    className="rounded-md px-2.5 py-1.5 text-xs text-white/75"
                    compact
                    onChange={(value) => {
                      setDueDate(value);
                      const nextValue = value ? new Date(`${value}T00:00:00`).toISOString() : null;
                      scheduleSave("dueDate", { dueDate: nextValue });
                    }}
                    placeholder="Set due date"
                    align="left"
                    value={dueDate}
                  />
                </div>
              </div>

              <section className="mt-10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Description</p>
                <textarea
                  className="mt-3 min-h-[140px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-[13.5px] leading-7 text-white/55 outline-none placeholder:text-white/20"
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
              </section>

              <SectionHeader badge={`${doneSubtasks} / ${subtasks.length} done`} title="Subtasks" />
              <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full bg-[#6C63FF]" style={{ width: `${subtaskProgress}%` }} />
              </div>
              <div className="mt-4 space-y-3">
                {subtasks.map((subtask) => (
                  <label className="flex items-center gap-3 text-sm text-white/75" key={subtask.id}>
                    <input
                      checked={subtask.done}
                      onChange={() =>
                        setSubtasks((current) =>
                          current.map((item) => (item.id === subtask.id ? { ...item, done: !item.done } : item)),
                        )
                      }
                      type="checkbox"
                    />
                    <span className={subtask.done ? "text-white/35 line-through" : ""}>{subtask.title}</span>
                  </label>
                ))}
                <div className="rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    onChange={(event) => setNewSubtask(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add subtask"
                    value={newSubtask}
                  />
                </div>
              </div>

              <SectionHeader badge={`${attachments.length}`} title="Attachments" />
              <div className="mt-4 space-y-3">
                {attachments.map((file) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3" key={file.id}>
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium uppercase ${fileColor(file.ext)}`}>
                      {file.ext}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{file.name}</p>
                      <p className="text-xs text-white/35">{file.size}</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-white/45">
                  Attach file
                </div>
              </div>

              <SectionHeader badge={`${activity.length}`} title="Activity" />
              <div className="mt-4 space-y-4">
                {activity.map((item) => (
                  <div className="flex gap-3" key={item.id}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/20 text-sm font-semibold text-[#a89fff]">
                      {item.user.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-white/55">
                        <span className="text-white/80">{item.user}</span>
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                      {item.type === "event" ? (
                        <div className="mt-2 text-sm text-white/55">
                          <span className="text-white/35 line-through">{item.oldValue}</span>
                          <span className="mx-2 text-white/25">→</span>
                          <span className="text-[#6C63FF]">{item.newValue}</span>
                        </div>
                      ) : (
                        <div className="mt-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words text-white/70">
                          {item.text}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/20 text-sm font-semibold text-[#a89fff]">
                    N
                  </div>
                  <textarea
                    className="min-h-[56px] flex-1 resize-none whitespace-pre-wrap break-words bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25"
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Leave a note..."
                    value={commentDraft}
                  />
                  <button className="self-end rounded-xl bg-[#6C63FF] p-2 text-white transition hover:bg-[#7a72ff]" onClick={addComment} type="button">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <ConfirmDeleteModal
        loading={deleteTask.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        open={confirmDeleteOpen}
      />
    </>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="mt-10 flex items-center gap-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{title}</p>
      <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-0.5 text-[11px] text-white/45">
        {badge}
      </span>
    </div>
  );
}
