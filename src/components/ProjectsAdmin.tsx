import { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/admin.css";

import { createProject, listProjects, setProjectActive, updateProject } from "../lib/client";
import type { Project } from "../types/project";
import ConfirmDialog from "./ConfirmDialog";
import ProjectForm from "./ProjectForm";
import ProjectsTable from "./ProjectsTable";

type StatusFilter = "all" | "active" | "inactive";

type EditorState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; project: Project };

interface Notice {
  type: "success" | "error";
  text: string;
}

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState<string>("");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [toHide, setToHide] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProjects(await listProjects());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Error al cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const upsert = (project: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
  };

  const counts = useMemo(() => {
    const active = projects.filter((p) => p.active).length;
    return { all: projects.length, active, inactive: projects.length - active };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (filter === "active" && !project.active) return false;
      if (filter === "inactive" && project.active) return false;
      if (!term) return true;
      return (
        project.title.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term)
      );
    });
  }, [projects, filter, search]);

  const closeEditor = useCallback(() => setEditor({ mode: "closed" }), []);
  const closeConfirm = useCallback(() => setToHide(null), []);

  const handleSubmit = async (formData: FormData) => {
    if (editor.mode === "edit") {
      const updated = await updateProject(editor.project.id, formData);
      upsert(updated);
      setNotice({ type: "success", text: `"${updated.title}" se actualizó correctamente.` });
    } else {
      const created = await createProject(formData);
      upsert(created);
      setNotice({ type: "success", text: `"${created.title}" se creó y ya está publicado.` });
    }
    setEditor({ mode: "closed" });
  };

  const handleHide = async () => {
    if (!toHide) return;
    const project = toHide;
    setBusyId(project.id);
    try {
      await setProjectActive(project.id, false);
      upsert({ ...project, active: false, updated_at: new Date().toISOString() });
      setNotice({ type: "success", text: `"${project.title}" ya no se muestra en el sitio.` });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo ocultar el proyecto.",
      });
    } finally {
      setBusyId(null);
      setToHide(null);
    }
  };

  const handleRestore = async (project: Project) => {
    setBusyId(project.id);
    try {
      const restored = await setProjectActive(project.id, true);
      if (restored) upsert(restored);
      setNotice({ type: "success", text: `"${project.title}" volvió a publicarse.` });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo restaurar el proyecto.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `Todos (${counts.all})` },
    { value: "active", label: `Publicados (${counts.active})` },
    { value: "inactive", label: `Ocultos (${counts.inactive})` },
  ];

  return (
    <section className="admin">
      <div className="toolbar">
        <div className="filters" role="group" aria-label="Filtrar por estado">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`chip ${filter === value ? "chip-selected" : ""}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <input
            type="search"
            className="search"
            placeholder="Buscar proyecto..."
            aria-label="Buscar proyecto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="button button-ghost"
            onClick={() => void loadProjects()}
            disabled={loading}
          >
            Recargar
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setEditor({ mode: "create" })}
          >
            + Nuevo proyecto
          </button>
        </div>
      </div>

      <div className="notice-area" aria-live="polite">
        {notice && (
          <p className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`}>
            {notice.text}
          </p>
        )}
      </div>

      {loading ? (
        <p className="empty">Cargando proyectos...</p>
      ) : loadError ? (
        <div className="alert alert-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="button button-ghost" onClick={() => void loadProjects()}>
            Reintentar
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <p className="empty">
          {projects.length === 0
            ? "Todavía no hay proyectos. Creá el primero con “Nuevo proyecto”."
            : "No hay proyectos que coincidan con el filtro."}
        </p>
      ) : (
        <ProjectsTable
          projects={visibleProjects}
          busyId={busyId}
          onEdit={(project) => setEditor({ mode: "edit", project })}
          onHide={setToHide}
          onRestore={(project) => void handleRestore(project)}
        />
      )}

      {editor.mode !== "closed" && (
        <ProjectForm
          key={editor.mode === "edit" ? editor.project.id : "new"}
          project={editor.mode === "edit" ? editor.project : null}
          onCancel={closeEditor}
          onSubmit={handleSubmit}
        />
      )}

      {toHide && (
        <ConfirmDialog
          title="Ocultar proyecto"
          message={`"${toHide.title}" dejará de mostrarse en alejoide.com. Podés restaurarlo cuando quieras.`}
          confirmLabel="Ocultar"
          busy={busyId === toHide.id}
          onConfirm={() => void handleHide()}
          onCancel={closeConfirm}
        />
      )}
    </section>
  );
}
