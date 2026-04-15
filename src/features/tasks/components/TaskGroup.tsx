import { ChevronRight, Plus } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Status } from "../../../api";

type TaskGroupProps = {
  title: string;
  count: number;
  children: ReactNode;
  defaultCollapsed?: boolean;
  hasHighlightedTask?: boolean;
  storageScope?: string;
  status: Status;
  onQuickAdd?: (status: Status, title: string) => Promise<void> | void;
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
  hasHighlightedTask = false,
  storageScope = "default",
  status,
  onQuickAdd,
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

  useEffect(() => {
    if (hasHighlightedTask) {
      setCollapsed(false);
    }
  }, [hasHighlightedTask]);

  return (
    <section className="space-y-1.5">
      <button
        className="group flex w-full items-center gap-2 rounded-md bg-white/[0.018] px-2 py-1 text-left text-[10px] uppercase tracking-[0.18em] text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.028] hover:text-white/62"
        onClick={() => setCollapsed((current) => !current)}
        type="button"
      >
        <ChevronRight className={collapsed ? "transition" : "rotate-90 transition"} size={12} strokeWidth={1.6} />
        <span>{title}</span>
        <span className="h-px flex-1 bg-white/[0.055] transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/[0.09]" />
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.045] px-1 text-[9px] tabular-nums text-white/28">{count}</span>
      </button>
      {!collapsed ? (
        <div className="space-y-0.5">
          {children}
          {onQuickAdd ? <InlineQuickAdd onQuickAdd={(titleValue) => onQuickAdd(status, titleValue)} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function InlineQuickAdd({ onQuickAdd }: { onQuickAdd: (title: string) => Promise<void> | void }) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onQuickAdd(trimmedTitle);
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex items-center gap-2 px-2.5 py-1" onSubmit={handleSubmit}>
      <Plus className="text-white/18" size={12} strokeWidth={1.7} />
      <input
        className="min-w-0 flex-1 bg-transparent text-[12px] text-white/64 outline-none placeholder:text-white/20"
        disabled={submitting}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add task"
        value={title}
      />
    </form>
  );
}
