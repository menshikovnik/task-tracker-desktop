import { Task } from "../../../api";
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
  loading,
  onOpenTask,
  storageScope = "default",
}: {
  tasks: Task[];
  loading: boolean;
  onOpenTask: (task: Task) => void;
  storageScope?: string;
}) {
  if (loading) {
    return <div className="p-6 text-sm text-white/50">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="p-6 text-sm text-white/50">No tasks here yet.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {STATUS_GROUPS.map((group) => {
        const groupTasks = tasks.filter((task) => task.status === group.key);
        if (groupTasks.length === 0) {
          return null;
        }

        return (
          <TaskGroup
            count={groupTasks.length}
            key={`${storageScope}:${group.key}`}
            storageScope={storageScope}
            title={group.label}
          >
            {groupTasks.map((task) => (
              <TaskRow key={task.id} onOpen={() => onOpenTask(task)} task={task} />
            ))}
          </TaskGroup>
        );
      })}
    </div>
  );
}
