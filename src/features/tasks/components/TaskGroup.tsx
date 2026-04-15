import { ChevronRight } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

type TaskGroupProps = {
  title: string;
  count: number;
  children: ReactNode;
  defaultCollapsed?: boolean;
  storageScope?: string;
};

const TASK_GROUP_STORAGE_KEY = "task-group-collapsed";

function readCollapsedState() {
  try {
    const storedValue = window.localStorage.getItem(TASK_GROUP_STORAGE_KEY);
    return storedValue ? (JSON.parse(storedValue) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function TaskGroup({
  title,
  count,
  children,
  defaultCollapsed = false,
  storageScope = "default",
}: TaskGroupProps) {
  const storageId = `${storageScope}:${title}`;
  const [collapsed, setCollapsed] = useState(() => {
    const collapsedState = readCollapsedState();
    return collapsedState[storageId] ?? defaultCollapsed;
  });

  useEffect(() => {
    const collapsedState = readCollapsedState();
    setCollapsed(collapsedState[storageId] ?? defaultCollapsed);
  }, [defaultCollapsed, storageId]);

  useEffect(() => {
    const collapsedState = readCollapsedState();
    window.localStorage.setItem(
      TASK_GROUP_STORAGE_KEY,
      JSON.stringify({
        ...collapsedState,
        [storageId]: collapsed,
      }),
    );
  }, [collapsed, storageId]);

  return (
    <section className="space-y-3">
      <button
        className="flex w-full items-center gap-2 text-left text-xs uppercase tracking-[0.18em] text-white/35 transition hover:text-white/70"
        onClick={() => setCollapsed((current) => !current)}
        type="button"
      >
        <ChevronRight className={collapsed ? "transition" : "rotate-90 transition"} size={14} />
        <span>{title}</span>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">{count}</span>
      </button>
      {!collapsed ? <div className="space-y-2">{children}</div> : null}
    </section>
  );
}
