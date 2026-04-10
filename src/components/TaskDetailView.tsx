import { ChevronLeft, Trash2 } from "lucide-react";
import { RefObject } from "react";
import { Priority, Status, Task } from "../api";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "../app/constants";
import { formatFullDate, formatPriority, formatStatus } from "../app/formatters";

type TaskDetailViewProps = {
  selectedTask: Task | null;
  detailDraft: {
    title: string;
    description: string;
  };
  detailSaving: boolean;
  deleteSaving: boolean;
  descriptionTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onBack: () => void;
  onDetailDraftChange: (field: "title" | "description", value: string) => void;
  onDetailBlur: (field: "title" | "description") => void;
  onTaskFieldUpdate: (field: "status" | "priority", value: Status | Priority) => void;
  onDelete: () => void;
};

export function TaskDetailView({
  selectedTask,
  detailDraft,
  detailSaving,
  deleteSaving,
  descriptionTextareaRef,
  onBack,
  onDetailDraftChange,
  onDetailBlur,
  onTaskFieldUpdate,
  onDelete,
}: TaskDetailViewProps) {
  return (
    <section className="detail-view">
      {selectedTask ? (
        <>
          <div className="detail-scrollable">
            <div className="detail-content-wrap">
              <button className="detail-back" onClick={onBack} type="button">
                <ChevronLeft size={16} />
                <span>All tasks</span>
              </button>

              <div className="detail-meta-line">
                <span
                  className={`detail-priority-dot detail-priority-dot--${selectedTask.priority.toLowerCase()}`}
                />
                <span>{selectedTask.priority}</span>
                <span className="detail-meta-separator">·</span>
                <span>{formatStatus(selectedTask.status).toUpperCase()}</span>
                <span className="detail-meta-separator">·</span>
                <span className="detail-date">{formatFullDate(selectedTask.createdAt)}</span>
              </div>

              <input
                className="detail-title-input"
                onBlur={() => onDetailBlur("title")}
                onChange={(event) => onDetailDraftChange("title", event.target.value)}
                value={detailDraft.title}
              />

              <hr className="detail-divider" />

              <textarea
                className="detail-description-input"
                onBlur={() => onDetailBlur("description")}
                onChange={(event) => onDetailDraftChange("description", event.target.value)}
                placeholder="Add description..."
                ref={descriptionTextareaRef}
                rows={1}
                value={detailDraft.description}
              />
            </div>
          </div>

          <div className="detail-footer">
            <div className="footer-group">
              <span className="footer-label">Status</span>
              <span className="detail-meta-separator">•</span>
              <div className="detail-pill-row">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    className={
                      selectedTask.status === status
                        ? `detail-pill detail-pill--status detail-pill--${status.toLowerCase()} is-active`
                        : `detail-pill detail-pill--status detail-pill--${status.toLowerCase()}`
                    }
                    disabled={detailSaving}
                    key={status}
                    onClick={() => onTaskFieldUpdate("status", status)}
                    type="button"
                  >
                    {formatStatus(status)}
                  </button>
                ))}
              </div>
            </div>

            <div className="footer-separator" />

            <div className="footer-group">
              <span className="footer-label">Priority</span>
              <span className="detail-meta-separator">•</span>
              <div className="detail-pill-row">
                {PRIORITY_OPTIONS.map((priority) => (
                  <button
                    className={
                      selectedTask.priority === priority
                        ? `detail-pill detail-pill--priority detail-pill--${priority.toLowerCase()} is-active`
                        : `detail-pill detail-pill--priority detail-pill--${priority.toLowerCase()}`
                    }
                    disabled={detailSaving}
                    key={priority}
                    onClick={() => onTaskFieldUpdate("priority", priority)}
                    type="button"
                  >
                    {priority === "MEDIUM" ? "Med" : formatPriority(priority)}
                  </button>
                ))}
              </div>
            </div>

            <div className="footer-separator" />

            <button
              className="footer-delete-button"
              disabled={deleteSaving}
              onClick={onDelete}
              type="button"
            >
              <Trash2 size={14} />
              <span>{deleteSaving ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="detail-empty">
          <span className="eyebrow">Details</span>
          <p>Select a task to inspect it here.</p>
        </div>
      )}
    </section>
  );
}
