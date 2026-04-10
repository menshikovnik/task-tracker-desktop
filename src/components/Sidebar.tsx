import { LogOut } from "lucide-react";
import fluxLogo from "../assets/flux-logo.svg";
import {
  SIDEBAR_PRIMARY_FILTERS,
  SIDEBAR_SECONDARY_FILTERS,
} from "../app/constants";
import { TaskFilter } from "../app/types";

type SidebarProps = {
  activeFilter: TaskFilter;
  user: string;
  onFilterChange: (filter: TaskFilter) => void;
  onLogout: () => void;
};

export function Sidebar({ activeFilter, user, onFilterChange, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand__mark">
            <img alt="Flux logo" className="brand__logo" src={fluxLogo} />
          </div>
          <div>
            <h1>Flux</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_PRIMARY_FILTERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={
                  activeFilter === item.key ? "sidebar-nav__item is-active" : "sidebar-nav__item"
                }
                key={item.key}
                onClick={() => onFilterChange(item.key)}
                type="button"
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="sidebar-nav__divider" />
          {SIDEBAR_SECONDARY_FILTERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={
                  activeFilter === item.key ? "sidebar-nav__item is-active" : "sidebar-nav__item"
                }
                key={item.label}
                onClick={() => onFilterChange(item.key)}
                type="button"
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-card__avatar">{user.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user}</strong>
            <span>Signed in</span>
          </div>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
