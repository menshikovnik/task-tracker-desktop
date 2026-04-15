import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { CalendarDays, Circle, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { Task } from "../../../api";

function getStatusClasses(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return "text-white/70";
    case "DONE":
      return "text-white/45";
    case "CANCELLED":
      return "text-white/22";
    case "OPEN":
    default:
      return "text-white/30";
  }
}

function getPriorityMeta(priority: Task["priority"]) {
  switch (priority) {
    case "HIGH":
      return { label: "High", className: "bg-red-500/[0.08] text-red-300/72", dot: "bg-red-300/70", icon: SignalHigh };
    case "MEDIUM":
      return { label: "Med", className: "bg-amber-400/[0.08] text-amber-200/62", dot: "bg-amber-200/60", icon: SignalMedium };
    case "LOW":
    default:
      return { label: "Low", className: "bg-emerald-400/[0.06] text-emerald-200/50", dot: "bg-emerald-200/45", icon: SignalLow };
  }
}

function formatDueDate(input?: string | null) {
  if (!input) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(input));
}

export function TaskRow({
  highlighted,
  task,
  onContextMenu,
  onOpen,
}: {
  highlighted: boolean;
  task: Task;
  onContextMenu: (event: MouseEvent<HTMLButtonElement>, task: Task) => void;
  onOpen: () => void;
}) {
  const priority = getPriorityMeta(task.priority);
  const PriorityIcon = priority.icon;
  const isMuted = task.status === "CANCELLED" || task.status === "DONE";
  const rowRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!highlighted || !rowRef.current) {
      return;
    }

    const rect = rowRef.current.getBoundingClientRect();
    const outsideViewport = rect.top < 0 || rect.bottom > window.innerHeight;
    if (outsideViewport) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [highlighted]);

  return (
    <button
      className={[
        "task-layout-item group grid w-full grid-cols-[18px_minmax(0,1fr)_auto_auto_auto] items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5 text-left transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.045]",
        highlighted ? "task-new-entry task-welcome-pulse" : "",
      ].join(" ")}
      onContextMenu={(event) => onContextMenu(event, task)}
      onClick={onOpen}
      ref={rowRef}
      type="button"
    >
      <Circle className={getStatusClasses(task.status)} size={10} strokeWidth={1.7} />
      <span
        className={[
          "min-w-0 truncate text-[13px] leading-5",
          isMuted ? "text-white/42" : "text-white/78",
          task.status === "CANCELLED" ? "line-through decoration-white/15" : "",
        ].join(" ")}
      >
        {task.title}
      </span>
      <span className={`hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] md:flex ${priority.className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
        <PriorityIcon className="hidden lg:block" size={11} strokeWidth={1.6} />
        {priority.label}
      </span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.045] text-[10px] font-medium text-white/32">
        L
      </span>
      <span className="flex min-w-[62px] items-center justify-end gap-1 text-[11px] text-white/28">
        <CalendarDays size={11} strokeWidth={1.6} />
        <span>{formatDueDate(task.dueDate)}</span>
      </span>
    </button>
  );
}
