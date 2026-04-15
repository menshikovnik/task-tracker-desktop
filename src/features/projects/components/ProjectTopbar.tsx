import { ChevronDown, Filter, Plus, Rows3, Trash2 } from "lucide-react";

type ProjectTopbarProps = {
  title: string;
  subtitle: string;
  color?: string | null;
  onCreateTask: () => void;
  onDeleteProject?: () => void;
  deleteProjectLoading?: boolean;
  isProjectView: boolean;
};

export function ProjectTopbar({
  title,
  subtitle,
  color,
  onCreateTask,
  onDeleteProject,
  deleteProjectLoading = false,
  isProjectView,
}: ProjectTopbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-6 py-5">
      <div className="flex min-w-0 items-center gap-3">
        {isProjectView ? (
          <span
            className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.03)]"
            style={{ backgroundColor: color || "#888888" }}
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-white/45">{subtitle}</p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {isProjectView && onDeleteProject ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteProjectLoading}
            onClick={onDeleteProject}
            type="button"
          >
            <Trash2 size={14} />
            {deleteProjectLoading ? "Deleting..." : "Delete"}
          </button>
        ) : null}
        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white" type="button">
          <Filter size={14} />
          Filter
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white" type="button">
          <Rows3 size={14} />
          Group by
          <ChevronDown size={14} />
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a72ff]"
          onClick={onCreateTask}
          type="button"
        >
          <Plus size={14} />
          New task
        </button>
      </div>
    </div>
  );
}
