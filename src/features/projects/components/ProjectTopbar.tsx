import type { RefObject } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Kbd } from "../../../components/Kbd";

type ProjectTopbarProps = {
  title: string;
  subtitle: string;
  color?: string | null;
  onCreateTask: () => void;
  onDeleteProject?: () => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  newTaskShortcutLabel?: string;
  deleteProjectLoading?: boolean;
  isProjectView: boolean;
};

export function ProjectTopbar({
  title,
  subtitle,
  color,
  onCreateTask,
  onDeleteProject,
  searchInputRef,
  searchQuery = "",
  onSearchChange,
  newTaskShortcutLabel,
  deleteProjectLoading = false,
  isProjectView,
}: ProjectTopbarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
      {/* Title block */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {isProjectView && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color || "#555558" }}
          />
        )}
        <h1 className="truncate text-[14px] font-semibold text-white/90">{title}</h1>
        <span className="hidden text-white/20 sm:inline">·</span>
        <span className="hidden truncate text-[13px] text-white/35 sm:block">{subtitle}</span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {onSearchChange ? (
          <label className="hidden h-8 items-center gap-1.5 rounded-full border border-white/[0.065] bg-white/[0.025] px-2.5 text-[12px] text-white/26 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-white/[0.12] focus-within:bg-white/[0.04] md:flex">
            <Search size={12} strokeWidth={1.7} />
            <input
              className="w-28 bg-transparent text-[12px] text-white/72 outline-none placeholder:text-white/24 lg:w-36"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search"
              ref={searchInputRef}
              value={searchQuery}
            />
            <Kbd>/</Kbd>
          </label>
        ) : null}
        {isProjectView && onDeleteProject && (
          <button
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-red-400/60 transition hover:bg-red-500/[0.08] hover:text-red-400 disabled:opacity-40"
            disabled={deleteProjectLoading}
            onClick={onDeleteProject}
            type="button"
          >
            <Trash2 size={13} strokeWidth={1.75} />
            {deleteProjectLoading ? "Deleting…" : "Delete"}
          </button>
        )}
        <button
          className="flex items-center gap-1.5 rounded-md bg-white/[0.07] px-3 py-1.5 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.11] hover:text-white"
          onClick={onCreateTask}
          type="button"
        >
          <Plus size={13} strokeWidth={2} />
          New task
          {newTaskShortcutLabel ? (
            <Kbd className="ml-1">{newTaskShortcutLabel}</Kbd>
          ) : null}
        </button>
      </div>
    </div>
  );
}
