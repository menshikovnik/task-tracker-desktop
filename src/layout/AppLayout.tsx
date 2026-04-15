import { ReactNode, cloneElement, isValidElement, useEffect, useState } from "react";
import { Navigate, matchPath, useLocation } from "react-router-dom";
import { Project, bootstrapSession, restoreAccessToken, Task } from "../api";
import { TaskDetailPanel } from "../features/tasks/components/TaskDetailPanel";

export function AppLayout({
  sidebar,
  children,
  selectedTask,
  detailOpen,
  detailMounted,
  projects,
  onCloseDetail,
  onToast,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  selectedTask: Task | null;
  detailOpen: boolean;
  detailMounted: boolean;
  projects: Project[];
  onCloseDetail: () => void;
  onToast: (toast: { title: string; message: string; tone?: "error" | "success" }) => void;
}) {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let active = true;

    void bootstrapSession().finally(() => {
      if (active) {
        setAuthResolved(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!authResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-sm text-white/45">
        Restoring session...
      </div>
    );
  }

  if (!restoreAccessToken()) {
    return <Navigate replace to="/auth" />;
  }
  const isTaskFullView =
    matchPath("/tasks/:taskId", location.pathname) !== null ||
    matchPath("/projects/:projectId/tasks/:taskId", location.pathname) !== null;
  const sidebarNode =
    isValidElement(sidebar)
      ? cloneElement(sidebar, {
          collapsed: !sidebarVisible,
          onToggleCollapsed: () => setSidebarVisible((current) => !current),
        } as Record<string, unknown>)
      : sidebar;

  return (
    <div className="flex min-h-screen bg-[#0f0f1a] text-white">
      <div
        className={[
          "app-shell-sidebar overflow-hidden border-r border-white/10 bg-[#1a1a2e]",
          sidebarVisible ? "app-shell-sidebar--visible" : "app-shell-sidebar--hidden",
        ].join(" ")}
      >
        {sidebarNode}
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="h-screen overflow-hidden">{children}</div>
        {!isTaskFullView ? (
          <TaskDetailPanel
            mounted={detailMounted}
            onClose={onCloseDetail}
            onToast={onToast}
            open={detailOpen}
            projects={projects}
            task={selectedTask}
          />
        ) : null}
      </div>
    </div>
  );
}
