import { FormEvent } from "react";
import { X } from "lucide-react";
import { Priority, Status } from "../api";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../app/constants";
import { formatPriority, formatStatus } from "../app/formatters";
import { TaskFormState } from "../app/types";
import { CustomSelect } from "./CustomSelect";

type NewTaskModalProps = {
  open: boolean;
  closing: boolean;
  taskSaving: boolean;
  taskForm: TaskFormState;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTaskFormChange: <K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) => void;
};

export function NewTaskModal({
  open,
  closing,
  taskSaving,
  taskForm,
  onClose,
  onSubmit,
  onTaskFormChange,
}: NewTaskModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={closing ? "modal-backdrop is-closing" : "modal-backdrop"}
      onClick={onClose}
      role="presentation"
    >
      <section
        className={closing ? "modal-card is-closing" : "modal-card"}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Create task</span>
            <h3>Capture the next piece of work</h3>
          </div>
          <button
            aria-label="Close new task modal"
            className="modal-close-button"
            disabled={taskSaving}
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form className="task-form" onSubmit={onSubmit}>
          <label>
            Title
            <input
              onChange={(event) => onTaskFormChange("title", event.target.value)}
              required
              value={taskForm.title}
            />
          </label>

          <label>
            Description
            <textarea
              onChange={(event) => onTaskFormChange("description", event.target.value)}
              rows={4}
              value={taskForm.description}
            />
          </label>

          <div className="task-form__row">
            <label>
              Priority
              <CustomSelect
                onChange={(value) => onTaskFormChange("priority", value as Priority)}
                options={PRIORITY_OPTIONS.map((priority) => ({
                  value: priority,
                  label: formatPriority(priority),
                }))}
                value={taskForm.priority}
              />
            </label>

            <label>
              Status
              <CustomSelect
                onChange={(value) => onTaskFormChange("status", value as Status)}
                options={STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: formatStatus(status),
                }))}
                value={taskForm.status}
              />
            </label>
          </div>

          <button className="primary-button primary-button--modal" disabled={taskSaving} type="submit">
            {taskSaving ? "Creating..." : "Create task"}
          </button>
        </form>
      </section>
    </div>
  );
}
