type DeleteConfirmModalProps = {
  open: boolean;
  deleteSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  open,
  deleteSaving,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <section
        className="modal-card modal-card--confirm"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Delete task</span>
            <h3>Are you sure?</h3>
          </div>
        </div>

        <p className="confirm-copy">This action will permanently remove the task from Flux.</p>

        <div className="confirm-actions">
          <button
            className="confirm-action-button confirm-action-button--neutral"
            disabled={deleteSaving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="confirm-action-button confirm-action-button--danger"
            disabled={deleteSaving}
            onClick={onConfirm}
            type="button"
          >
            {deleteSaving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
