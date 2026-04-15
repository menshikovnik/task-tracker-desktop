import { FormEvent, MouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Calendar, Plus } from "lucide-react";
import { Task } from "../../../api";
import { TaskContextMenu } from "./TaskContextMenu";
import { useUpdateTask } from "../hooks/useUpdateTask";

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS: {
  id: Task["status"];
  label: string;
  accent: string;        // dot color
  headerActive: string;  // header bg when column is focused
}[] = [
  { id: "OPEN",        label: "Open",        accent: "bg-white/20",     headerActive: "bg-white/[0.04]"    },
  { id: "IN_PROGRESS", label: "In Progress", accent: "bg-indigo-400/70", headerActive: "bg-indigo-500/[0.06]" },
  { id: "DONE",        label: "Done",        accent: "bg-emerald-400/70",headerActive: "bg-emerald-500/[0.06]" },
  { id: "CANCELLED",   label: "Cancelled",   accent: "bg-white/15",     headerActive: "bg-white/[0.02]"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PriorityInfo = { dot: string; label: string; text: string };

function getPriority(priority: Task["priority"]): PriorityInfo {
  switch (priority) {
    case "HIGH":   return { dot: "bg-red-500/60",   label: "High", text: "text-red-400/60"   };
    case "MEDIUM": return { dot: "bg-amber-400/50", label: "Med",  text: "text-amber-400/50" };
    default:       return { dot: "bg-white/15",     label: "Low",  text: "text-white/30"     };
  }
}

function formatDueDate(input?: string | null) {
  if (!input) return null;
  const d = new Date(input);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = d < now;
  const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  return { label, isOverdue };
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  ghost,
  highlighted,
  onOpen,
  onContextMenu,
}: {
  task: Task;
  ghost?: boolean;
  highlighted: boolean;
  onOpen: () => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>, task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({ id: task.id });

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const due = formatDueDate(task.dueDate);
  const priority = getPriority(task.priority);
  const isCancelled = task.status === "CANCELLED";

  useEffect(() => {
    if (!highlighted || !cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const outsideViewport =
      rect.top < 0 ||
      rect.bottom > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth;
    if (outsideViewport) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [highlighted]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={task.title}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;
        (listeners as Record<string, (event: ReactPointerEvent) => void>)?.onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        if (pointerDownPos.current) {
          const dx = Math.abs(e.clientX - pointerDownPos.current.x);
          const dy = Math.abs(e.clientY - pointerDownPos.current.y);
          if (dx > 4 || dy > 4) didDrag.current = true;
        }
      }}
      onClick={() => { if (!didDrag.current) onOpen(); }}
      onContextMenu={(event) => onContextMenu(event, task)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
      className={[
        "task-layout-item group relative rounded-lg border p-2.5 select-none outline-none transition-colors duration-100",
        highlighted ? "task-new-entry task-welcome-pulse" : "",
        ghost || isDragging
          ? "border-white/[0.05] bg-white/[0.02] opacity-30"
          : isCancelled
            ? "border-white/[0.04] bg-[#161618] opacity-40 cursor-grab hover:opacity-55"
            : "border-white/[0.06] bg-[#1a1a1c] cursor-grab active:cursor-grabbing hover:border-white/[0.10] hover:bg-[#1f1f22] focus-visible:ring-1 focus-visible:ring-white/15",
      ].join(" ")}
    >
      {/* Title */}
      <p
        className={[
          "mb-3 text-[13px] leading-[1.5] line-clamp-3",
          isCancelled
            ? "text-white/30 line-through decoration-white/15"
            : "text-white/80",
        ].join(" ")}
      >
        {task.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-2">
        {/* Priority dot + label */}
        {!isCancelled && (
          <span className={`flex items-center gap-1.5 ${priority.text}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${priority.dot}`} />
            <span className="text-[11px]">{priority.label}</span>
          </span>
        )}

        {/* Due date */}
        {due && (
          <span
            className={[
              "ml-auto flex items-center gap-1 text-[11px]",
              due.isOverdue && !isCancelled ? "text-red-400/60" : "text-white/20",
            ].join(" ")}
          >
            <Calendar size={10} strokeWidth={1.75} />
            {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Drag overlay ─────────────────────────────────────────────────────────────

function TaskCardOverlay({ task }: { task: Task }) {
  const due = formatDueDate(task.dueDate);
  const priority = getPriority(task.priority);

  return (
    <div className="rounded-lg border border-white/10 bg-[#222226] p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.65)] rotate-[1.5deg] cursor-grabbing select-none">
      <p className="mb-3 text-[13px] leading-[1.5] text-white/80 line-clamp-3">{task.title}</p>
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 ${priority.text}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${priority.dot}`} />
          <span className="text-[11px]">{priority.label}</span>
        </span>
        {due && (
          <span className={`ml-auto flex items-center gap-1 text-[11px] ${due.isOverdue ? "text-red-400/60" : "text-white/20"}`}>
            <Calendar size={10} strokeWidth={1.75} />
            {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function BoardColumn({
  column,
  tasks,
  activeId,
  highlightedTaskId,
  isOver,
  isFocused,
  onOpen,
  onContextMenu,
  onQuickAdd,
  onToggleFocus,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  activeId: number | null;
  highlightedTaskId: number | null;
  isOver: boolean;
  isFocused: boolean;
  onOpen: (task: Task) => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>, task: Task) => void;
  onQuickAdd: (title: string) => Promise<void> | void;
  onToggleFocus: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onQuickAdd(trimmedTitle);
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col" style={{ minWidth: 180 }}>
      {/* Column header — clickable to focus/isolate */}
      <button
        type="button"
        onClick={onToggleFocus}
        className={[
        "group mb-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isFocused
            ? `border-white/[0.10] ${column.headerActive}`
            : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]",
        ].join(" ")}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${column.accent}`} />
        <span className="text-[11px] font-medium text-white/45 group-hover:text-white/60">
          {column.label}
        </span>
        <span className="text-[11px] text-white/20">·</span>
        <span className="text-[11px] tabular-nums text-white/25">{tasks.length}</span>
      </button>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-1.5 rounded-lg p-1 transition-colors duration-100",
          isOver ? "bg-white/[0.03] ring-1 ring-white/[0.07]" : "",
        ].join(" ")}
        style={{ minHeight: 100 }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            ghost={task.id === activeId}
            highlighted={task.id === highlightedTaskId}
            onContextMenu={onContextMenu}
            onOpen={() => onOpen(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={[
              "flex flex-1 items-center justify-center rounded-md border border-dashed py-8 transition-colors duration-100",
              isOver ? "border-white/10" : "border-white/[0.04]",
            ].join(" ")}
          >
            <span className="text-[11px] text-white/12">No tasks</span>
          </div>
        )}
      </div>

      <form
        className="mt-1.5 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:bg-white/[0.035] hover:bg-white/[0.025]"
        onSubmit={handleQuickAdd}
      >
        <Plus className="shrink-0 text-white/18" size={12} strokeWidth={1.7} />
        <input
          className="min-w-0 flex-1 bg-transparent text-[12px] text-white/64 outline-none placeholder:text-white/20"
          disabled={submitting}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add task"
          value={title}
        />
      </form>
    </div>
  );
}

// ─── Board root ───────────────────────────────────────────────────────────────

export function TaskBoard({
  tasks,
  highlightedTaskId,
  loading,
  onDeleteTask,
  onOpenTask,
  onQuickAdd,
  onToast,
}: {
  tasks: Task[];
  highlightedTaskId: number | null;
  loading: boolean;
  onDeleteTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onQuickAdd: (status: Task["status"], title: string) => Promise<void> | void;
  onToast?: (toast: { title: string; message: string; tone?: "error" | "success" }) => void;
}) {
  const updateTask = useUpdateTask();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [overColumnId, setOverColumnId] = useState<Task["status"] | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<Task["status"] | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<number, Task["status"]>>({});
  const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const visibleTasks = tasks.map((task) => {
    const optimisticStatus = optimisticStatuses[task.id];
    return optimisticStatus ? { ...task, status: optimisticStatus } : task;
  });

  const activeTask = activeTaskId != null
    ? visibleTasks.find((t) => t.id === activeTaskId) ?? null
    : null;

  const visibleColumns = focusedColumn
    ? COLUMNS.filter((c) => c.id === focusedColumn)
    : COLUMNS;

  const tasksByStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.id, visibleTasks.filter((t) => t.status === col.id)]),
  ) as Record<Task["status"], Task[]>;

  useEffect(() => {
    if (!highlightedTaskId || !focusedColumn) {
      return;
    }

    const highlightedTask = visibleTasks.find((task) => task.id === highlightedTaskId);
    if (highlightedTask && highlightedTask.status !== focusedColumn) {
      setFocusedColumn(null);
    }
  }, [focusedColumn, highlightedTaskId, visibleTasks]);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTaskId(active.id as number);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverColumnId((over?.id as Task["status"]) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTaskId(null);
    setOverColumnId(null);
    if (!over) return;
    const taskId = active.id as number;
    const newStatus = over.id as Task["status"];
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setOptimisticStatuses((current) => ({ ...current, [taskId]: newStatus }));
    updateTask.mutate(
      { id: taskId, payload: { status: newStatus } },
      {
        onSettled: () => {
          setOptimisticStatuses((current) => {
            const { [taskId]: _finishedTaskStatus, ...rest } = current;
            return rest;
          });
        },
      },
    );
  }

  function handleTaskContextMenu(event: MouseEvent<HTMLDivElement>, task: Task) {
    event.preventDefault();
    setContextMenu({
      task,
      x: event.clientX,
      y: event.clientY,
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[13px] text-white/25">Loading…</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-2.5 overflow-x-auto px-5 py-4">
        {visibleColumns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            tasks={tasksByStatus[col.id]}
            activeId={activeTaskId}
            highlightedTaskId={highlightedTaskId}
            isOver={overColumnId === col.id}
            isFocused={focusedColumn === col.id}
            onContextMenu={handleTaskContextMenu}
            onOpen={onOpenTask}
            onQuickAdd={(title) => onQuickAdd(col.id, title)}
            onToggleFocus={() =>
              setFocusedColumn((prev) => (prev === col.id ? null : col.id))
            }
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>

      {contextMenu ? (
        <TaskContextMenu
          onClose={() => setContextMenu(null)}
          onDeleteTask={onDeleteTask}
          onToast={onToast}
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      ) : null}
    </DndContext>
  );
}
