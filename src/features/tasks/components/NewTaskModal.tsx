import { FormEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Priority, Project, Status } from "../../../api";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";

export function NewTaskModal({
  open,
  closing,
  loading,
  projects,
  initialProjectId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  closing: boolean;
  loading: boolean;
  projects: Project[];
  initialProjectId?: number;
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
  const [status, setStatus] = useState<Status>("OPEN");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const modalShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const nextOffsetRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setProjectId(initialProjectId ? String(initialProjectId) : "none");
  }, [initialProjectId, open]);

  useEffect(() => {
    if (open) {
      offsetRef.current = { x: 0, y: 0 };
      nextOffsetRef.current = { x: 0, y: 0 };
      if (modalShellRef.current) {
        modalShellRef.current.style.transform = "translate3d(0px, 0px, 0)";
      }
    }
  }, [open]);

  useEffect(() => {
    function commitDragFrame() {
      animationFrameRef.current = null;
      const nextOffset = nextOffsetRef.current;
      offsetRef.current = nextOffset;
      if (modalShellRef.current) {
        modalShellRef.current.style.transform = `translate3d(${nextOffset.x}px, ${nextOffset.y}px, 0)`;
      }
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      nextOffsetRef.current = {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      };

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(commitDragFrame);
      }
    }

    function handlePointerUp(event: globalThis.PointerEvent) {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          commitDragFrame();
        }
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!open) {
    return null;
  }

  function handleDragStart(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    setStatus("OPEN");
    setPriority("MEDIUM");
    setDueDate("");
    setProjectId(initialProjectId ? String(initialProjectId) : "none");
  }

  return (
    <div className={`modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-6 py-10 pb-[340px] backdrop-blur-sm${closing ? " is-closing" : ""}`}>
      <div
        className="w-full max-w-2xl"
        ref={modalShellRef}
      >
        <div className={`modal-surface w-full rounded-[28px] border border-white/10 bg-[#151525] p-6 shadow-2xl${closing ? " is-closing" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div
            className="min-w-0 flex-1 touch-none select-none cursor-grab active:cursor-grabbing"
            onPointerDown={handleDragStart}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Tasks</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Capture the next step</h2>
          </div>
          <button
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-white/70">
            <span>Title</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <label className="block space-y-2 text-sm text-white/70">
            <span>Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className="block space-y-2 text-sm text-white/70">
              <span>Status</span>
              <CustomSelect
                onChange={(value) => setStatus(value as Status)}
                options={[
                  { value: "OPEN", label: "OPEN" },
                  { value: "IN_PROGRESS", label: "IN PROGRESS" },
                  { value: "DONE", label: "DONE" },
                  { value: "CANCELLED", label: "CANCELLED" },
                ]}
                value={status}
              />
            </label>

            <label className="block space-y-2 text-sm text-white/70">
              <span>Priority</span>
              <CustomSelect
                onChange={(value) => setPriority(value as Priority)}
                options={[
                  { value: "LOW", label: "LOW" },
                  { value: "MEDIUM", label: "MEDIUM" },
                  { value: "HIGH", label: "HIGH" },
                ]}
                value={priority}
              />
            </label>

            <label className="block space-y-2 text-sm text-white/70">
              <span>Due date</span>
              <CustomDateInput
                className="rounded-2xl"
                compact
                onChange={setDueDate}
                align="right"
                value={dueDate}
              />
            </label>

            <label className="block space-y-2 text-sm text-white/70">
              <span>Project</span>
              <CustomSelect
                onChange={(value) => setProjectId(String(value))}
                options={[
                  { value: "none", label: "No project" },
                  ...projects
                    .filter((project) => !project.archived)
                    .map((project) => ({ value: String(project.id), label: project.name })),
                ]}
                value={projectId}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-[#6C63FF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#7a72ff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !title.trim()}
              type="submit"
            >
              {loading ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
