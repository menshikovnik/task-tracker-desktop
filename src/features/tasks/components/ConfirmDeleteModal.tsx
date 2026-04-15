type ConfirmDeleteModalProps = {
  open: boolean;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  loading = false,
  title = "Delete task?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] border border-white/[0.07] bg-[#0e0e1c] p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/45">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
