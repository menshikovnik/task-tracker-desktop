import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Palette } from "lucide-react";
import { formatShortcut, getModifierKeyLabel, isModifierPressed } from "../../../app/platform";
import { CommandModal } from "../../../components/modal/CommandModal";

const PRESET_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];

type NewProjectModalProps = {
  open: boolean;
  closing: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string; color: string }) => Promise<void> | void;
};

export function NewProjectModal({ open, closing, loading, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const disabled = useMemo(() => loading || !name.trim(), [loading, name]);
  const submitShortcutLabel = formatShortcut([getModifierKeyLabel(), "Enter"]);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }

    descriptionRef.current.style.height = "auto";
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [description]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      color,
    });
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") {
      return;
    }

    if (isModifierPressed(event)) {
      event.preventDefault();
      if (!disabled) {
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
    <CommandModal closing={closing} eyebrow="Projects" onClose={onClose} open={open} title="New Project">
          <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit}>
            <div className="px-5 py-4">
              <input
                autoFocus
                className="w-full bg-transparent text-xl font-medium leading-7 text-white/88 outline-none placeholder:text-white/24"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project name"
                value={name}
              />

              <textarea
                className="mt-2 max-h-48 min-h-12 w-full resize-none overflow-hidden bg-transparent text-[13px] leading-5 text-white/52 outline-none placeholder:text-white/20"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add project details..."
                ref={descriptionRef}
                rows={2}
                value={description}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.055] px-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-h-7 items-center gap-1.5 rounded-md px-1.5 text-white/30">
                  <Palette size={13} strokeWidth={1.6} />
                  <span className="text-[12px] text-white/46">Color</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      aria-label={`Pick ${preset}`}
                      className={[
                        "h-5 w-5 rounded-md border transition-all duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        color === preset
                          ? "scale-105 border-white/55 opacity-100"
                          : "border-white/0 opacity-48 hover:scale-105 hover:opacity-90",
                      ].join(" ")}
                      key={preset}
                      onClick={() => setColor(preset)}
                      style={{ backgroundColor: preset }}
                      type="button"
                    />
                  ))}
                </div>
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
                  disabled={disabled}
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
