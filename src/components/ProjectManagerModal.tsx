import { FormEvent } from "react";
import { Archive, FolderOpen, PencilLine, Plus, X } from "lucide-react";
import { Project, ProjectFormState } from "../app/types";

type ProjectManagerModalProps = {
  open: boolean;
  closing: boolean;
  projects: Project[];
  projectForm: ProjectFormState;
  editingProjectId: number | null;
  onClose: () => void;
  onProjectFormChange: <K extends keyof ProjectFormState>(
    field: K,
    value: ProjectFormState[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditProject: (projectId: number) => void;
  onArchiveToggle: (projectId: number) => void;
  onCreateNew: () => void;
};

export function ProjectManagerModal({
  open,
  closing,
  projects,
  projectForm,
  editingProjectId,
  onClose,
  onProjectFormChange,
  onSubmit,
  onEditProject,
  onArchiveToggle,
  onCreateNew,
}: ProjectManagerModalProps) {
  if (!open) {
    return null;
  }

  const activeProjects = projects.filter((project) => !project.isArchived);
  const archivedProjects = projects.filter((project) => project.isArchived);

  return (
    <div
      className={closing ? "modal-backdrop is-closing" : "modal-backdrop"}
      onClick={onClose}
      role="presentation"
    >
      <section
        className={["modal-card", "project-manager", closing ? "is-closing" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Projects</span>
            <h3>Manage workspace projects</h3>
          </div>
          <button
            aria-label="Close project manager"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="project-manager__layout">
          <div className="project-manager__list">
            <div className="project-manager__section-header">
              <span>Active</span>
              <strong>{activeProjects.length}</strong>
            </div>
            <div className="project-manager__items">
              {activeProjects.map((project) => (
                <article className="project-manager__item" key={project.id}>
                  <div className="project-manager__item-main">
                    <span
                      className="project-manager__color"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <strong>{project.name}</strong>
                      <p>{project.description || "No description yet."}</p>
                    </div>
                  </div>
                  <div className="project-manager__item-actions">
                    <button onClick={() => onEditProject(project.id)} type="button">
                      <PencilLine size={14} />
                      Edit
                    </button>
                    <button onClick={() => onArchiveToggle(project.id)} type="button">
                      <Archive size={14} />
                      Archive
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="project-manager__section-header">
              <span>Archived</span>
              <strong>{archivedProjects.length}</strong>
            </div>
            <div className="project-manager__items">
              {archivedProjects.length === 0 ? (
                <p className="project-manager__empty">Archived projects will appear here.</p>
              ) : (
                archivedProjects.map((project) => (
                  <article className="project-manager__item is-archived" key={project.id}>
                    <div className="project-manager__item-main">
                      <span
                        className="project-manager__color"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <strong>{project.name}</strong>
                        <p>{project.description || "No description yet."}</p>
                      </div>
                    </div>
                    <div className="project-manager__item-actions">
                      <button onClick={() => onArchiveToggle(project.id)} type="button">
                        <FolderOpen size={14} />
                        Restore
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <form className="task-form project-manager__form" onSubmit={onSubmit}>
            <div className="project-manager__form-header">
              <div>
                <span className="eyebrow">
                  {editingProjectId ? "Update project" : "Create project"}
                </span>
                <h4>{editingProjectId ? "Edit project details" : "Add a new project shell"}</h4>
              </div>
              <button className="ghost-button ghost-button--compact" onClick={onCreateNew} type="button">
                <Plus size={14} />
                New
              </button>
            </div>

            <label>
              Name
              <input
                maxLength={60}
                onChange={(event) => onProjectFormChange("name", event.target.value)}
                required
                value={projectForm.name}
              />
            </label>

            <label>
              Description
              <textarea
                onChange={(event) => onProjectFormChange("description", event.target.value)}
                rows={4}
                value={projectForm.description}
              />
            </label>

            <label>
              Color
              <div className="project-color-field">
                <input
                  className="project-color-field__picker"
                  onChange={(event) => onProjectFormChange("color", event.target.value)}
                  type="color"
                  value={projectForm.color}
                />
                <input
                  maxLength={7}
                  onChange={(event) => onProjectFormChange("color", event.target.value)}
                  value={projectForm.color}
                />
              </div>
            </label>

            <button className="primary-button primary-button--modal" type="submit">
              {editingProjectId ? "Save project" : "Create project"}
            </button>
            <p className="project-manager__note">
              Projects are stored through the backend API and synced with your workspace.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
