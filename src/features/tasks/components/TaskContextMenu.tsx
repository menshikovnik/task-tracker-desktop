import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Clipboard, Trash2 } from "lucide-react";
import { normalizeApiError, Priority, Status, Task } from "../../../api";
import { useUpdateTask } from "../hooks/useUpdateTask";

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

type Toast = {
  title: string;
  message: string;
  tone?: "error" | "success";
};

type TaskContextMenuProps = {
  onClose: () => void;
  onDeleteTask: (task: Task) => void;
  onToast?: (toast: Toast) => void;
  task: Task;
  x: number;
  y: number;
};

function buildTaskUrl(task: Task) {
  const path = task.projectId ? `/projects/${task.projectId}/tasks/${task.id}` : `/tasks/${task.id}`;
  return `${window.location.origin}${path}`;
}

export function TaskContextMenu({ onClose, onDeleteTask, onToast, task, x, y }: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x, y });
  const updateTask = useUpdateTask();

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }

    const rect = menu.getBoundingClientRect();
    const viewportPadding = 10;
    setPosition({
      x: Math.max(viewportPadding, Math.min(x, window.innerWidth - rect.width - viewportPadding)),
      y: Math.max(viewportPadding, Math.min(y, window.innerHeight - rect.height - viewportPadding)),
    });
  }, [x, y]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleUpdate(payload: Partial<Pick<Task, "status" | "priority">>) {
    updateTask.mutate(
      { id: task.id, payload },
      {
        onError: (error) => {
          const normalized = normalizeApiError(error);
          onToast?.({
            title: "Couldn't update task",
            message: normalized.message,
            tone: "error",
          });
        },
      },
    );
    onClose();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildTaskUrl(task));
      onToast?.({
        title: "Task link copied",
        message: task.title,
        tone: "success",
      });
    } catch {
      onToast?.({
        title: "Couldn't copy link",
        message: "Your system clipboard is not available right now.",
        tone: "error",
      });
    } finally {
      onClose();
    }
  }

  function handleDelete() {
    onDeleteTask(task);
    onClose();
  }

  return (
    <FloatingPortal>
    <div
      aria-label="Task actions"
      className="task-context-menu fixed z-[100] w-[218px] rounded-lg border border-white/[0.08] bg-[#141416]/92 p-1.5 shadow-[0_18px_56px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
      ref={menuRef}
      role="menu"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-2 py-1.5">
        <p className="truncate text-[12px] font-medium text-white/72">{task.title}</p>
        <p className="mt-0.5 text-[10px] text-white/24">Esc to close</p>
      </div>

      <div className="my-1 h-px bg-white/[0.055]" />

      <MenuSection title="Change Status">
        {STATUS_OPTIONS.map((option) => (
          <MenuChoice
            active={task.status === option.value}
            key={option.value}
            label={option.label}
            onClick={() => handleUpdate({ status: option.value })}
          />
        ))}
      </MenuSection>

      <MenuSection title="Set Priority">
        {PRIORITY_OPTIONS.map((option) => (
          <MenuChoice
            active={task.priority === option.value}
            key={option.value}
            label={option.label}
            onClick={() => handleUpdate({ priority: option.value })}
          />
        ))}
      </MenuSection>

      <div className="my-1 h-px bg-white/[0.055]" />

      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-white/58 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.055] hover:text-white/82"
        onClick={() => void handleCopyLink()}
        role="menuitem"
        type="button"
      >
        <Clipboard className="text-white/28" size={13} strokeWidth={1.7} />
        <span className="flex-1">Copy Link</span>
      </button>

      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-red-300/68 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-red-500/[0.075] hover:text-red-200"
        onClick={handleDelete}
        role="menuitem"
        type="button"
      >
        <Trash2 className="text-red-300/38" size={13} strokeWidth={1.7} />
        <span className="flex-1">Delete Task</span>
        <kbd className="text-[10px] text-red-200/32">Del</kbd>
      </button>
    </div>
    </FloatingPortal>
  );
}

function FloatingPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

function MenuSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="py-1">
      <p className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/22">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuChoice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-white/54 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.055] hover:text-white/82"
      onClick={onClick}
      role="menuitemradio"
      type="button"
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/[0.035] text-white/55">
        {active ? <Check size={10} strokeWidth={2} /> : null}
      </span>
      {label}
    </button>
  );
}
