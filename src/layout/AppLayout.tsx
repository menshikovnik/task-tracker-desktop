import { PointerEvent, ReactNode, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { Navigate, matchPath, useLocation } from "react-router-dom";
import { Project, bootstrapSession, restoreAccessToken, Task } from "../api";
import { TaskDetailPanel } from "../features/tasks/components/TaskDetailPanel";

const COLLAPSED_SIDEBAR_WIDTH = 46;
const SIDEBAR_MIN_WIDTH = 208;
const SIDEBAR_MAX_WIDTH = 300;
const DETAIL_MIN_WIDTH = 400;
const DETAIL_MAX_WIDTH = 720;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AppLayout({
  sidebar,
  children,
  selectedTask,
  detailOpen,
  detailMounted,
  projects,
  onCloseDetail,
  onDeleteTask,
  onToast,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  selectedTask: Task | null;
  detailOpen: boolean;
  detailMounted: boolean;
  projects: Project[];
  onCloseDetail: () => void;
  onDeleteTask: (task: Task) => void;
  onToast: (toast: { title: string; message: string; tone?: "error" | "success" }) => void;
}) {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(208);
  const [detailWidth, setDetailWidth] = useState(420);
  const sidebarShellRef = useRef<HTMLDivElement | null>(null);
  const contentShellRef = useRef<HTMLDivElement | null>(null);
  const detailWidthRef = useRef(detailWidth);
  const isTaskFullView =
    matchPath("/tasks/:taskId", location.pathname) !== null ||
    matchPath("/projects/:projectId/tasks/:taskId", location.pathname) !== null;
  const detailActive = detailOpen && detailMounted && !isTaskFullView;
  const effectiveSidebarWidth = sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH;
  const effectiveDetailWidth = clamp(detailWidth, DETAIL_MIN_WIDTH, DETAIL_MAX_WIDTH);

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

  useEffect(() => {
    if (!detailOpen) {
      setDetailExpanded(false);
    }
  }, [detailOpen]);

  useEffect(() => {
    detailWidthRef.current = detailWidth;
  }, [detailWidth]);

  useEffect(() => {
    if (sidebarShellRef.current) {
      sidebarShellRef.current.style.width = `${effectiveSidebarWidth}px`;
    }
  }, [effectiveSidebarWidth]);

  useEffect(() => {
    if (contentShellRef.current && detailActive && !detailExpanded) {
      contentShellRef.current.style.flexBasis = `calc(100% - ${effectiveDetailWidth}px)`;
    } else if (contentShellRef.current) {
      contentShellRef.current.style.flexBasis = "";
    }
  }, [detailActive, detailExpanded, effectiveDetailWidth]);

  if (!authResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111113] text-sm text-white/45">
        Restoring session...
      </div>
    );
  }

  if (!restoreAccessToken()) {
    return <Navigate replace to="/auth" />;
  }

  const sidebarNode =
    isValidElement(sidebar)
      ? cloneElement(sidebar, {
          collapsed: !sidebarVisible,
          onToggleCollapsed: () => setSidebarVisible((current) => !current),
        } as Record<string, unknown>)
      : sidebar;

  function handleSidebarResizeStart(event: PointerEvent<HTMLDivElement>) {
    if (!sidebarVisible) {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    const pointerId = event.pointerId;
    let nextWidth = startWidth;
    event.currentTarget.setPointerCapture(pointerId);
    sidebarShellRef.current?.classList.add("is-resizing");

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      nextWidth = clamp(startWidth + moveEvent.clientX - startX, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
      if (sidebarShellRef.current) {
        sidebarShellRef.current.style.width = `${nextWidth}px`;
      }
    }

    function handlePointerUp() {
      sidebarShellRef.current?.classList.remove("is-resizing");
      setSidebarWidth(nextWidth);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleDetailResizeStart(event: PointerEvent<HTMLDivElement>) {
    if (!detailActive || detailExpanded) {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = effectiveDetailWidth;
    const pointerId = event.pointerId;
    let nextWidth = startWidth;
    event.currentTarget.setPointerCapture(pointerId);
    contentShellRef.current?.classList.add("is-resizing");
    document.documentElement.classList.add("is-task-detail-resizing");
    document.documentElement.style.setProperty("--task-detail-width", `${startWidth}px`);

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      nextWidth = clamp(startWidth + startX - moveEvent.clientX, DETAIL_MIN_WIDTH, DETAIL_MAX_WIDTH);
      detailWidthRef.current = nextWidth;
      if (contentShellRef.current) {
        contentShellRef.current.style.flexBasis = `calc(100% - ${nextWidth}px)`;
      }
      document.documentElement.style.setProperty("--task-detail-width", `${nextWidth}px`);
    }

    function handlePointerUp() {
      contentShellRef.current?.classList.remove("is-resizing");
      document.documentElement.classList.remove("is-task-detail-resizing");
      setDetailWidth(nextWidth);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111113] text-white">
      <div
        className="app-shell-sidebar relative overflow-hidden border-r border-white/[0.06] bg-[#111113]"
        ref={sidebarShellRef}
        style={{ width: `${effectiveSidebarWidth}px` }}
      >
        {sidebarNode}
        {sidebarVisible ? (
          <div
            aria-label="Resize sidebar"
            className="group absolute -right-1 top-0 z-20 flex h-full w-2 cursor-col-resize justify-center"
            onPointerDown={handleSidebarResizeStart}
            role="separator"
          >
            <span className="h-full w-px bg-transparent transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/[0.10]" />
          </div>
        ) : null}
      </div>
      <div className="relative flex min-w-0 flex-1 overflow-hidden">
        <div
          className={[
            "h-screen min-w-0 flex-1 overflow-hidden transition-[flex-basis,opacity] duration-200 ease-[cubic-bezier(0.05,0.7,0.1,1)]",
            detailActive && !detailExpanded ? "" : "basis-full",
            detailExpanded ? "pointer-events-none" : "",
          ].join(" ")}
          ref={contentShellRef}
          style={detailActive && !detailExpanded ? { flexBasis: `calc(100% - ${effectiveDetailWidth}px)` } : undefined}
        >
          {children}
        </div>
        {!isTaskFullView ? (
          <TaskDetailPanel
            mounted={detailMounted}
            onClose={onCloseDetail}
            onDeleteTask={onDeleteTask}
            onExpandedChange={setDetailExpanded}
            onToast={onToast}
            open={detailOpen}
            expanded={detailExpanded}
            width={effectiveDetailWidth}
            onResizeStart={handleDetailResizeStart}
            projects={projects}
            task={selectedTask}
          />
        ) : null}
      </div>
    </div>
  );
}
