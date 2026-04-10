import { Trash2 } from "lucide-react";

type TaskContextMenuProps = {
  contextMenu: {
    taskId: number;
    x: number;
    y: number;
  } | null;
  deleteSaving: boolean;
  onDelete: (taskId: number) => void;
};

export function TaskContextMenu({
  contextMenu,
  deleteSaving,
  onDelete,
}: TaskContextMenuProps) {
  if (!contextMenu) {
    return null;
  }

  return (
    <div
      className="context-menu"
      onClick={(event) => event.stopPropagation()}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button
        className="context-menu__item context-menu__item--danger"
        disabled={deleteSaving}
        onClick={() => onDelete(contextMenu.taskId)}
        type="button"
      >
        <Trash2 size={14} />
        <span>{deleteSaving ? "Deleting..." : "Delete task"}</span>
      </button>
    </div>
  );
}
