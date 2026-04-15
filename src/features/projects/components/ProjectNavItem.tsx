import { NavLink } from "react-router-dom";
import { Project } from "../../../api";

type ProjectNavItemProps = {
  project: Project;
  count: number;
  collapsed?: boolean;
  highlighted?: boolean;
};

export function ProjectNavItem({ project, count, collapsed = false, highlighted = false }: ProjectNavItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          highlighted ? "project-nav-item--new" : "",
          "flex rounded-xl text-sm transition",
          collapsed ? "justify-center px-0 py-3" : "items-center gap-3 px-3 py-2.5",
          isActive
            ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "text-white/70 hover:bg-white/5 hover:text-white",
        ].join(" ")
      }
      title={`${project.name} (${count})`}
      to={`/projects/${project.id}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: project.color || "#888888" }}
      />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate">{project.name}</span>}
      {collapsed ? null : (
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">
          {count}
        </span>
      )}
    </NavLink>
  );
}
