import { useState } from "react";
import type { MouseEvent } from "react";
import { Status, Task } from "../../../api";
import { TaskContextMenu } from "./TaskContextMenu";
import { TaskGroup } from "./TaskGroup";
import { TaskRow } from "./TaskRow";

const STATUS_GROUPS: Array<{ key: Task["status"]; label: string }> = [
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "OPEN", label: "Open" },
  { key: "DONE", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
];

export function TaskList({
  tasks,
  highlightedTaskId,
  loading,
  onDeleteTask,
  onOpenTask,
  onQuickAdd,
  onToast,
  storageScope = "default",
}: {
  tasks: Task[];
  highlightedTaskId: number | null;
  loading: boolean;
  onDeleteTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onQuickAdd?: (status: Status, title: string) => Promise<void> | void;
  onToast?: (toast: { title: string; message: string; tone?: "error" | "success" }) => void;
  storageScope?: string;
}) {
  const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null);

  function handleTaskContextMenu(event: MouseEvent<HTMLButtonElement>, task: Task) {
    event.preventDefault();
    setContextMenu({
      task,
      x: event.clientX,
      y: event.clientY,
    });
  }

  if (loading) {
    return <div className="p-6 text-sm text-white/50">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="p-6 text-sm text-white/50">No tasks here yet.</div>;
  }

  return (
    <div className="space-y-5 px-5 py-4">
      {STATUS_GROUPS.map((group) => {
        const groupTasks = tasks.filter((task) => task.status === group.key);
        const hasHighlightedTask = groupTasks.some((task) => task.id === highlightedTaskId);
        if (groupTasks.length === 0) {
          return null;
        }

        return (
          <TaskGroup
            count={groupTasks.length}
            hasHighlightedTask={hasHighlightedTask}
            key={`${storageScope}:${group.key}`}
            onQuickAdd={onQuickAdd}
            status={group.key}
            storageScope={storageScope}
            title={group.label.toUpperCase()}
          >
            {groupTasks.map((task) => (
              <TaskRow
                key={task.id}
                highlighted={task.id === highlightedTaskId}
                onContextMenu={handleTaskContextMenu}
                onOpen={() => onOpenTask(task)}
                task={task}
              />
            ))}
          </TaskGroup>
        );
      })}

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
    </div>
  );
}
