import type { Project } from "../types/project";

interface ProjectsTableProps {
  projects: Project[];
  busyId: number | null;
  onEdit: (project: Project) => void;
  onHide: (project: Project) => void;
  onRestore: (project: Project) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export default function ProjectsTable({
  projects,
  busyId,
  onEdit,
  onHide,
  onRestore,
}: ProjectsTableProps) {
  return (
    <div className="table-wrapper">
      <table className="projects-table">
        <thead>
          <tr>
            <th scope="col">Imagen</th>
            <th scope="col">Proyecto</th>
            <th scope="col">Enlaces</th>
            <th scope="col">Estado</th>
            <th scope="col">Actualizado</th>
            <th scope="col">
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const busy = busyId === project.id;
            return (
              <tr key={project.id} className={project.active ? undefined : "row-inactive"}>
                <td data-label="Imagen">
                  <div className="thumbnail">
                    {project.image ? (
                      <img src={project.image} alt="" loading="lazy" />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </td>
                <td data-label="Proyecto" className="cell-project">
                  <strong>{project.title}</strong>
                  <p>{project.description}</p>
                </td>
                <td data-label="Enlaces" className="cell-links">
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    Sitio ↗
                  </a>
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                      Repo ↗
                    </a>
                  )}
                </td>
                <td data-label="Estado">
                  <span className={`badge ${project.active ? "badge-active" : "badge-inactive"}`}>
                    {project.active ? "Publicado" : "Oculto"}
                  </span>
                </td>
                <td data-label="Actualizado" className="cell-date">
                  <time dateTime={project.updated_at} title={`Creado: ${formatDate(project.created_at)}`}>
                    {formatDate(project.updated_at)}
                  </time>
                </td>
                <td className="cell-actions">
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => onEdit(project)}
                    disabled={busy}
                  >
                    Editar
                  </button>
                  {project.active ? (
                    <button
                      type="button"
                      className="button button-danger-ghost"
                      onClick={() => onHide(project)}
                      disabled={busy}
                    >
                      Ocultar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => onRestore(project)}
                      disabled={busy}
                    >
                      {busy ? "Restaurando..." : "Restaurar"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
