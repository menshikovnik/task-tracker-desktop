import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { CalendarDays, CircleDot, Flag, UserRound } from "lucide-react";
import { Priority, Project, Status } from "../../../api";
import { formatShortcut, getModifierKeyLabel, isModifierPressed } from "../../../app/platform";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";
import { CommandModal } from "../../../components/modal/CommandModal";

export function NewTaskModal({
  open,
  closing,
  loading,
  projects,
  initialProjectId,
  initialStatus,
  onClose,
  onSubmit,
}: {
  open: boolean;
  closing: boolean;
  loading: boolean;
  projects: Project[];
  initialProjectId?: number;
  initialStatus?: Status;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    dueDate: string | null;
    projectId: number | null;
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(initialStatus ?? "OPEN");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const submitShortcutLabel = formatShortcut([getModifierKeyLabel(), "Enter"]);

  useEffect(() => {
    setProjectId(initialProjectId ? String(initialProjectId) : "none");
  }, [initialProjectId, open]);

  useEffect(() => {
    setStatus(initialStatus ?? "OPEN");
  }, [initialStatus, open]);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }

    descriptionRef.current.style.height = "auto";
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [description]);

  const activeProject = useMemo(
    () =>
      projectId === "none"
        ? null
        : projects.find((project) => String(project.id) === projectId) ?? null,
    [projectId, projects],
  );

  if (!open) {
    return null;
  }

  async function submitTask() {
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      projectId: projectId === "none" ? null : Number(projectId),
    });

    setTitle("");
    setDescription("");
    setStatus(initialStatus ?? "OPEN");
    setPriority("MEDIUM");
    setDueDate("");
    setProjectId(initialProjectId ? String(initialProjectId) : "none");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitTask();
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") {
      return;
    }

    const shouldSubmit = isModifierPressed(event);
    if (shouldSubmit) {
      event.preventDefault();
      if (!loading && title.trim()) {
        event.currentTarget.requestSubmit();
      }
      return;
    }

    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    event.preventDefault();
  }

  return (
    <CommandModal
      closing={closing}
      eyebrow={activeProject?.name ?? "No project"}
      onClose={onClose}
      open={open}
      title="New Task"
    >
        <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <input
              autoFocus
              className="w-full bg-transparent text-xl font-medium leading-7 text-white/88 outline-none placeholder:text-white/24"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              required
              value={title}
            />

            <textarea
              className="mt-2 max-h-48 min-h-12 w-full resize-none overflow-hidden bg-transparent text-[13px] leading-5 text-white/52 outline-none placeholder:text-white/20"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add details..."
              ref={descriptionRef}
              rows={2}
              value={description}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.055] px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <MetaControl icon={<CircleDot size={13} strokeWidth={1.6} />}>
                <CustomSelect
                  onChange={(value) => setStatus(value as Status)}
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "DONE", label: "Done" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                  triggerClassName="border-transparent bg-transparent px-1.5 py-1 text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
                  menuClassName="min-w-[150px]"
                  value={status}
                />
              </MetaControl>

              <MetaControl icon={<Flag size={13} strokeWidth={1.6} />}>
                <CustomSelect
                  onChange={(value) => setPriority(value as Priority)}
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                  ]}
                  triggerClassName="border-transparent bg-transparent px-1.5 py-1 text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
                  menuClassName="min-w-[124px]"
                  value={priority}
                />
              </MetaControl>

              <MetaControl icon={<UserRound size={13} strokeWidth={1.6} />}>
                <button
                  className="flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-white/46 outline-none transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] active:duration-0"
                  type="button"
                >
                  L
                </button>
              </MetaControl>

              <MetaControl icon={<CalendarDays size={13} strokeWidth={1.6} />}>
                <CustomDateInput
                  className="border-transparent bg-transparent px-1.5 py-1 text-[12px] text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
                  compact
                  showIcon={false}
                  onChange={setDueDate}
                  align="right"
                  value={dueDate}
                />
              </MetaControl>

              <CustomSelect
                onChange={(value) => setProjectId(String(value))}
                options={[
                  { value: "none", label: "No project" },
                  ...projects
                    .filter((project) => !project.archived)
                    .map((project) => ({ value: String(project.id), label: project.name })),
                ]}
                triggerClassName="max-w-[150px] border-transparent bg-transparent px-2 py-1 text-white/42 hover:border-transparent hover:bg-white/[0.045] focus:border-transparent"
                menuClassName="min-w-[180px]"
                value={projectId}
              />
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-white/42 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.045] hover:text-white/70 active:duration-0"
                onClick={onClose}
                type="button"
              >
                Cancel <kbd className="text-[10px] text-white/20">Esc</kbd>
              </button>
              <button
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/[0.10] px-2.5 text-[12px] font-medium text-white/82 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.14] active:duration-0 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loading || !title.trim()}
                type="submit"
              >
                {loading ? "Creating" : "Create"} <kbd className="text-[10px] text-white/28">{submitShortcutLabel}</kbd>
              </button>
            </div>
          </div>
        </form>
    </CommandModal>
  );
}

function MetaControl({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="group flex min-h-7 items-center gap-1 rounded-md px-1 text-white/30 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-white/52">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
