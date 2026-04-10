import { Sparkles } from "lucide-react";
import { Task } from "../api";
import { FILTERS, TITLE_BY_FILTER } from "../app/constants";
import { formatDate, formatPriority } from "../app/formatters";
import { TaskFilter } from "../app/types";

type TaskListViewProps = {
  activeFilter: TaskFilter;
  groupedTasks: Array<{ priority: Task["priority"]; tasks: Task[] }>;
  hoveredTaskId: number | null;
  taskLoading: boolean;
  onFilterChange: (filter: TaskFilter) => void;
  onHoverChange: (taskId: number | null) => void;
  onOpenTask: (taskId: number) => void;
  onOpenTaskModal: () => void;
  onOpenContextMenu: (taskId: number, x: number, y: number) => void;
};

export function TaskListView({
  activeFilter,
  groupedTasks,
  hoveredTaskId,
  taskLoading,
  onFilterChange,
  onHoverChange,
  onOpenTask,
  onOpenTaskModal,
  onOpenContextMenu,
}: TaskListViewProps) {
  return (
    <section className="task-column task-column--list">
      <header className="task-column__header">
        <div className="task-column__title-wrap">
          <h2>{TITLE_BY_FILTER[activeFilter]}</h2>
        </div>
        <button className="primary-button" onClick={onOpenTaskModal} type="button">
          New task
        </button>
      </header>

      <div className="filter-bar">
        {FILTERS.map((filter) => (
          <button
            className={activeFilter === filter.key ? "filter-pill is-active" : "filter-pill"}
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="ai-focus-bar">
        <div className="ai-focus-bar__icon">
          <Sparkles />
        </div>
        <p>High-priority work is clustering around open items. Review the top queue next.</p>
        <button className="ghost-button ghost-button--compact" type="button">
          Show plan
        </button>
      </div>

      <div className="task-groups">
        {taskLoading ? <p className="empty-state">Loading tasks...</p> : null}
        {!taskLoading && groupedTasks.length === 0 ? (
          <p className="empty-state">No tasks match this filter yet.</p>
        ) : null}

        {!taskLoading
          ? groupedTasks.map((group) => (
              <section className="task-group" key={group.priority}>
                <div className="task-group__header">
                  <span>{formatPriority(group.priority)}</span>
                  <span>{group.tasks.length}</span>
                </div>
                <div className="task-list">
                  {group.tasks.map((task) => (
                    <button
                      className={hoveredTaskId === task.id ? "task-row is-hovered" : "task-row"}
                      key={task.id}
                      onClick={() => onOpenTask(task.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onOpenContextMenu(task.id, event.clientX, event.clientY);
                      }}
                      onMouseEnter={() => onHoverChange(task.id)}
                      onMouseLeave={() =>
                        onHoverChange(hoveredTaskId === task.id ? null : hoveredTaskId)
                      }
                      type="button"
                    >
                      <span className="task-row__checkbox" />
                      <span className="task-row__title">{task.title}</span>
                      <span className="task-row__date">{formatDate(task.createdAt)}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          : null}
      </div>
    </section>
  );
}
