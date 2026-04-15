import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Maximize2, Minimize2, Send, Trash2, X } from "lucide-react";
import { Project, Task } from "../../../api";
import { useShortcut } from "../../../app/useShortcut";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";
import { useDebouncedTaskPatch } from "../hooks/useDebouncedTaskPatch";
import { ActivityTimeline, Avatar, IconButton, MetadataRow, SectionHeader } from "./detail/DetailPrimitives";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  autosizeTextarea,
  defaultActivity,
  defaultSubtasks,
  fileHoverTone,
  formatCreatedAt,
  priorityDot,
  statusDot,
  toDateInputValue,
} from "./detail/detailHelpers";
import { ActivityItem, Attachment, Subtask, ToastHandler } from "./detail/detailTypes";

export function TaskDetailPanel({
  task,
  open,
  mounted,
  expanded,
  width,
  projects,
  onClose,
  onDeleteTask,
  onExpandedChange,
  onResizeStart,
  onToast,
}: {
  task: Task | null;
  open: boolean;
  mounted: boolean;
  expanded: boolean;
  width: number;
  projects: Project[];
  onClose: () => void;
  onDeleteTask: (task: Task) => void;
  onExpandedChange: (expanded: boolean) => void;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onToast: ToastHandler;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("OPEN");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>(defaultSubtasks);
  const [newSubtask, setNewSubtask] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>(defaultActivity);
  const [commentDraft, setCommentDraft] = useState("");
  const [savedVisible, setSavedVisible] = useState(false);
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

  const attachments = useMemo<Attachment[]>(
    () => [
      { id: 1, name: "spec-overview.pdf", size: "1.2 MB", ext: "pdf" },
      { id: 2, name: "panel-mock.png", size: "384 KB", ext: "png" },
      { id: 3, name: "desktop-assets.zip", size: "6.8 MB", ext: "zip" },
    ],
    [],
  );

  const { flushSave, scheduleSave } = useDebouncedTaskPatch(currentTask?.id ?? 0, {
    onSaved: () => {
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
      setSavedVisible(true);
      savedTimeoutRef.current = window.setTimeout(() => setSavedVisible(false), 1200);
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
    if (!currentTask) return;
    setTitle(currentTask.title);
    setDescription(currentTask.description ?? "");
    setStatus(currentTask.status);
    setPriority(currentTask.priority);
    setDueDate(toDateInputValue(currentTask.dueDate));
  }, [currentTask]);

  useEffect(() => autosizeTextarea(titleRef.current), [title]);
  useEffect(() => autosizeTextarea(descriptionRef.current), [description]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (expanded) {
          onExpandedChange(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expanded, onClose, onExpandedChange, open]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  useShortcut(
    { key: "Enter", mod: true, enabled: open && Boolean(currentTask), allowInEditable: true },
    () => {
      if (!currentTask) {
        return;
      }

      if (title.trim() && title !== currentTask.title) {
        void flushSave("title", { title: title.trim() });
      }

      if (description !== (currentTask.description ?? "")) {
        void flushSave("description", { description });
      }
    },
  );

  if (!mounted || !currentTask) return null;

  const taskItem = currentTask;
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const subtaskProgress = subtasks.length === 0 ? 0 : (doneSubtasks / subtasks.length) * 100;

  function addSubtask(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks((current) => [...current, { id: Date.now(), title: newSubtask.trim(), done: false }]);
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
      <aside
        className={[
          "h-screen shrink-0 overflow-hidden border-l border-white/[0.065] bg-[#111113] transition-[width,opacity] duration-200 ease-[cubic-bezier(0.05,0.7,0.1,1)]",
          "task-detail-resizable",
          open ? "opacity-100" : "w-0 opacity-0",
          open && expanded ? "absolute right-0 top-0 z-30 w-full shadow-[-24px_0_80px_rgba(0,0,0,0.28)]" : "",
          open && !expanded ? "relative" : "",
        ].join(" ")}
        style={open && !expanded ? { width: `var(--task-detail-width, ${width}px)` } : undefined}
      >
        {open && !expanded ? (
          <div
            aria-label="Resize task panel"
            className="group absolute -left-1 top-0 z-20 flex h-full w-2 cursor-col-resize justify-center"
            onPointerDown={onResizeStart}
            role="separator"
          >
            <span className="h-full w-px bg-transparent transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/[0.10]" />
          </div>
        ) : null}
        <div className="flex h-full min-w-[400px] flex-col">
          <header className="flex h-12 items-center justify-between border-b border-white/[0.055] bg-[#111113]/95 px-3 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[10px] uppercase tracking-[0.16em] text-white/24">FLUX-{currentTask.id}</span>
              <span className={["text-[11px] text-white/34 transition-opacity duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]", savedVisible ? "opacity-100" : "opacity-0"].join(" ")}>
                Saved
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              <IconButton label="Delete task" onClick={() => onDeleteTask(taskItem)}>
                <Trash2 size={14} strokeWidth={1.55} />
              </IconButton>
              <IconButton label={expanded ? "Collapse panel" : "Expand panel"} onClick={() => onExpandedChange(!expanded)}>
                {expanded ? <Minimize2 size={14} strokeWidth={1.55} /> : <Maximize2 size={14} strokeWidth={1.55} />}
              </IconButton>
              <IconButton label="Close panel" onClick={onClose}>
                <X size={14} strokeWidth={1.55} />
              </IconButton>
            </div>
          </header>

          <div className="task-detail-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <textarea
              className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-[16px] font-medium leading-6 text-white/86 outline-none"
              onBlur={() => {
                if (title.trim() && title !== currentTask.title) void flushSave("title", { title: title.trim() });
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setTitle(nextValue);
                if (nextValue.trim()) scheduleSave("title", { title: nextValue.trim() });
              }}
              ref={titleRef}
              rows={1}
              value={title}
            />

            <textarea
              className="mt-3 min-h-[92px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-white/[0.06] bg-white/[0.018] px-3 py-2.5 text-[12.5px] leading-5 text-white/58 outline-none placeholder:text-white/20 focus:border-white/[0.12] focus:bg-white/[0.028]"
              onBlur={() => {
                if (description !== (currentTask.description ?? "")) void flushSave("description", { description });
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

            <div className="my-4 h-px bg-white/[0.055]" />

            <div className="space-y-2.5">
              <MetadataRow label="Status">
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
                  triggerClassName="rounded-full border-transparent bg-transparent px-2 py-1 text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  menuClassName="min-w-[176px]"
                  value={status}
                />
              </MetadataRow>

              <MetadataRow label="Priority">
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
                  triggerClassName="rounded-full border-transparent bg-transparent px-2 py-1 text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  value={priority}
                />
              </MetadataRow>

              <MetadataRow label="Due date">
                <CustomDateInput
                  className="min-h-7 rounded-md border-transparent bg-transparent px-2 py-1 text-[12px] text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  compact
                  onChange={(value) => {
                    setDueDate(value);
                    scheduleSave("dueDate", { dueDate: value ? new Date(`${value}T00:00:00`).toISOString() : null });
                  }}
                  align="right"
                  value={dueDate}
                />
              </MetadataRow>

              <MetadataRow label="Project">
                {currentProject ? (
                  <span className="inline-flex min-h-7 items-center gap-2 rounded-md px-2 py-1 text-[12px] text-white/56 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.028]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentProject.color || "#777777" }} />
                    {currentProject.name}
                  </span>
                ) : (
                  <span className="inline-flex min-h-7 items-center rounded-md px-2 py-1 text-[12px] text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.028]">
                    No project
                  </span>
                )}
              </MetadataRow>

              <MetadataRow label="Created">
                <span className="text-[12px] text-white/34">{formatCreatedAt(currentTask.createdAt)}</span>
              </MetadataRow>
            </div>

            <SectionHeader badge={`${doneSubtasks}/${subtasks.length}`} title="Subtasks" />
            <div className="mt-3 border-l border-white/[0.075] pl-3">
              <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-white/[0.055]">
                <div className="h-full rounded-full bg-white/28" style={{ width: `${subtaskProgress}%` }} />
              </div>
              <div className="space-y-1.5">
                {subtasks.map((subtask) => (
                  <label className="flex items-center gap-2 text-[12px] text-white/58" key={subtask.id}>
                    <input
                      checked={subtask.done}
                      className="task-checkbox"
                      onChange={() =>
                        setSubtasks((current) =>
                          current.map((item) => (item.id === subtask.id ? { ...item, done: !item.done } : item)),
                        )
                      }
                      type="checkbox"
                    />
                    <span className={subtask.done ? "text-white/28 line-through decoration-white/16" : ""}>{subtask.title}</span>
                  </label>
                ))}
                <form className="flex items-center gap-2 pt-1" onSubmit={addSubtask}>
                  <span className="h-3 w-3 border border-white/[0.10]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-white/58 outline-none placeholder:text-white/20"
                    onChange={(event) => setNewSubtask(event.target.value)}
                    placeholder="Add subtask"
                    value={newSubtask}
                  />
                </form>
              </div>
            </div>

            <SectionHeader badge={`${attachments.length}`} title="Attachments" />
            <div className="mt-2 divide-y divide-white/[0.055] border-y border-white/[0.055]">
              {attachments.map((file) => (
                <div className="group flex items-center gap-2.5 py-2 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.018]" key={file.id}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.03] text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${fileHoverTone(file.ext)}`}>
                    <FileText size={12} strokeWidth={1.55} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-white/62">{file.name}</p>
                    <p className="text-[10px] uppercase text-white/26">{file.ext} - {file.size}</p>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader badge={`${activity.length}`} title="Activity" />
            <ActivityTimeline activity={activity} />

            <div className="mt-3 flex gap-2 border-t border-white/[0.055] pt-3">
              <Avatar letter="N" />
              <textarea
                className="min-h-[48px] flex-1 resize-none rounded-lg border border-white/[0.06] bg-white/[0.018] px-3 py-2 text-[12px] leading-5 text-white/62 outline-none placeholder:text-white/20 focus:border-white/[0.12]"
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Leave a note..."
                value={commentDraft}
              />
              <button className="self-end rounded-md p-2 text-white/34 transition hover:bg-white/[0.045] hover:text-white/68" onClick={addComment} type="button">
                <Send size={13} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </div>
      </aside>

    </>
  );
}
