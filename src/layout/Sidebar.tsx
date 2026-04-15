import { useMemo } from "react";
import { FolderPlus, LayoutGrid, LogOut, ChevronDown, Clock3, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import fluxLogo from "../assets/flux-logo.svg";
import { Project, Task } from "../api";
import { ProjectNavItem } from "../features/projects/components/ProjectNavItem";

function isToday(dateString?: string | null) {
  if (!dateString) {
    return false;
  }

  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function Sidebar({
  user,
  projects,
  allTasks,
  collapsed = false,
  showArchived,
  onToggleCollapsed,
  onToggleArchived,
  onOpenNewProject,
  onLogout,
  highlightedProjectId,
  projectTaskCounts,
}: {
  user: string;
  projects: Project[];
  allTasks: Task[];
  projectTaskCounts?: Record<number, number>;
  collapsed?: boolean;
  showArchived: boolean;
  onToggleCollapsed?: () => void;
  onToggleArchived: () => void;
  onOpenNewProject: () => void;
  onLogout: () => void;
  highlightedProjectId?: number | null;
}) {
  const location = useLocation();

  const projectCounts = useMemo(
    () =>
      allTasks.reduce<Record<number, number>>((counts, task) => {
        if (typeof task.projectId === "number") {
          counts[task.projectId] = (counts[task.projectId] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [allTasks],
  );

  const todayCount = useMemo(() => allTasks.filter((task) => isToday(task.dueDate)).length, [allTasks]);
  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);

  return (
    <aside
      className={[
        "flex h-screen shrink-0 flex-col bg-[#1a1a2e] py-4 transition-[width,padding] duration-300 ease-out",
        collapsed ? "w-[84px] px-2" : "w-[280px] px-3",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center pb-5 pt-1",
          collapsed ? "flex-col gap-3 px-0" : "gap-3 px-3",
        ].join(" ")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
          <img alt="Flux logo" className="h-7 w-7" src={fluxLogo} />
        </div>
        {collapsed ? null : (
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-white">Flux</p>
            <p className="text-xs text-white/35">Project-first task space</p>
          </div>
        )}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className={["space-y-1", collapsed ? "px-0" : "px-1"].join(" ")}>
        <NavLink
          className={({ isActive }) =>
            [
              "group flex rounded-xl text-sm transition",
              collapsed
                ? "justify-center px-0 py-3"
                : "items-center gap-3 px-3 py-2.5",
              isActive && location.search !== "?view=today"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white",
            ].join(" ")
          }
          title="My tasks"
          to="/tasks"
        >
          <LayoutGrid size={16} />
          {collapsed ? null : <span>My tasks</span>}
        </NavLink>
        <NavLink
          className={() =>
            [
              "group flex rounded-xl text-sm transition",
              collapsed
                ? "justify-center px-0 py-3"
                : "items-center gap-3 px-3 py-2.5",
              location.pathname === "/tasks" && location.search === "?view=today"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white",
            ].join(" ")
          }
          title={`Today${collapsed ? ` (${todayCount})` : ""}`}
          to="/tasks?view=today"
        >
          <Clock3 size={16} />
          {collapsed ? null : <span>Today</span>}
          {collapsed ? null : (
            <span className="ml-auto rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">
              {todayCount}
            </span>
          )}
        </NavLink>
      </div>

      <div className="mx-3 my-4 h-px bg-white/10" />

      <div className="min-h-0 flex-1 overflow-hidden">
        {collapsed ? (
          <div className="pb-3 text-center text-[11px] uppercase tracking-[0.22em] text-white/25">P</div>
        ) : (
          <div className="flex items-center justify-between px-3 pb-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/35">Projects</span>
          </div>
        )}

        <div className={["h-full overflow-y-auto pb-4", collapsed ? "px-0" : "px-1"].join(" ")}>
          <div className="space-y-1">
            {activeProjects.map((project) => (
              <ProjectNavItem
                collapsed={collapsed}
                count={projectTaskCounts?.[project.id] ?? projectCounts[project.id] ?? 0}
                highlighted={project.id === highlightedProjectId}
                key={project.id}
                project={project}
              />
            ))}
          </div>

          <button
            className={[
              "mt-3 flex rounded-xl border border-dashed border-white/10 bg-white/[0.03] text-sm text-white/65 transition hover:bg-white/5 hover:text-white",
              collapsed ? "w-full justify-center px-0 py-3" : "w-full items-center gap-2 px-3 py-2.5",
            ].join(" ")}
            onClick={onOpenNewProject}
            title="New project"
            type="button"
          >
            <FolderPlus size={16} />
            {collapsed ? null : "New project"}
          </button>

          {archivedProjects.length > 0 ? (
            <div className="mt-4 space-y-3">
              <button
                className={[
                  "flex text-xs text-white/45 transition hover:text-white/75",
                  collapsed ? "w-full justify-center" : "items-center gap-2",
                ].join(" ")}
                onClick={onToggleArchived}
                title={`Show archived (${archivedProjects.length})`}
                type="button"
              >
                <ChevronDown className={showArchived ? "rotate-0 transition" : "-rotate-90 transition"} size={14} />
                {collapsed ? null : `Show archived (${archivedProjects.length})`}
              </button>

              {showArchived ? (
                <div className="space-y-1">
                  {archivedProjects.map((project) => (
                    <ProjectNavItem
                      collapsed={collapsed}
                      count={projectTaskCounts?.[project.id] ?? projectCounts[project.id] ?? 0}
                      highlighted={project.id === highlightedProjectId}
                      key={project.id}
                      project={project}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className={["mt-3 border-t border-white/10 pt-3", collapsed ? "px-0" : "px-2"].join(" ")}>
        <div
          className={[
            "rounded-2xl bg-white/5",
            collapsed ? "flex justify-center px-0 py-3" : "flex items-center gap-3 px-3 py-3",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6C63FF]/20 text-sm font-semibold text-[#9b95ff]">
            {user.slice(0, 1).toUpperCase()}
          </div>
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user}</p>
              <p className="text-xs text-white/40">Signed in</p>
            </div>
          )}
        </div>
        <button
          className={[
            "mt-3 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white",
            collapsed ? "px-0 py-3" : "gap-2 px-3 py-2.5",
          ].join(" ")}
          onClick={onLogout}
          title="Logout"
          type="button"
        >
          <LogOut size={14} />
          {collapsed ? null : "Logout"}
        </button>
      </div>
    </aside>
  );
}
